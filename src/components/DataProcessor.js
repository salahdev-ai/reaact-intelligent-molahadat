import * as XLSX from 'xlsx';

// Parse a single exam file and extract student data
const parseExamFile = (fileData, examNumber) => {
  try {
    const workbook = XLSX.read(fileData, { type: 'array', cellDates: true });
    const sheetName = workbook.SheetNames[0]; // Get first sheet
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    
    const students = [];
    let headerRowIndex = -1;
    
    // Find header row (where column B contains "ID" in Arabic)
    for (let i = 0; i < data.length; i++) {
      if (data[i] && data[i][1] === "ID") {
        headerRowIndex = i;
        break;
      }
    }
    
    if (headerRowIndex === -1) {
      console.warn(`No header row found in exam ${examNumber}`);
      return students;
    }
    
    // Extract subject names from header rows
    const subjectHeaderRow = data[headerRowIndex];
    const scoreHeaderRow = data[headerRowIndex + 1] || [];
    
    // Map column indices to subject names
    const subjectMap = {};
    const subjectColumns = [];
    
    // Subject columns start at index 5 (column F)
    for (let col = 5; col < subjectHeaderRow.length; col += 2) {
      if (subjectHeaderRow[col] && typeof subjectHeaderRow[col] === 'string') {
        const subjectName = subjectHeaderRow[col].toString().trim();
        // Check if this is actually a subject name (not a placeholder or empty)
        if (subjectName && subjectName.length > 1 && !subjectName.includes('#')) {
          subjectMap[col] = subjectName;
          subjectColumns.push(col);
        }
      }
    }
    
    // If no subjects found, use default subjects
    if (subjectColumns.length === 0) {
      console.log(`Using default subjects for exam ${examNumber}`);
      const defaultSubjects = [
        { col: 5, name: 'التعبير الكتابي' },
        { col: 7, name: 'القراءة' },
        { col: 9, name: 'الإملاء' },
        { col: 11, name: 'الخط' },
        { col: 13, name: 'الإستماع والتحدث' },
        { col: 15, name: 'تمارين كتابية' }
      ];
      
      defaultSubjects.forEach(subject => {
        subjectMap[subject.col] = subject.name;
        subjectColumns.push(subject.col);
      });
    }
    
    // Process each student row
    for (let row = headerRowIndex + 2; row < data.length; row++) {
      const rowData = data[row];
      
      // Stop if no student ID or empty row
      if (!rowData || !rowData[1] || rowData[1] === '') continue;
      if (!rowData[2] || !rowData[3]) continue; // Skip if missing student number or name
      
      const studentId = rowData[1].toString().trim();
      const studentNumber = rowData[2] ? rowData[2].toString().trim() : '';
      const studentName = rowData[3] ? rowData[3].toString().trim() : '';
      
      // Handle birth date - convert Excel date if needed
      let birthDate = '';
      if (rowData[5]) {
        if (rowData[5] instanceof Date) {
          birthDate = rowData[5].toISOString().split('T')[0];
        } else {
          birthDate = rowData[5].toString().trim();
        }
      }
      
      const student = {
        id: studentId,
        studentNumber: studentNumber,
        name: studentName,
        birthDate: birthDate,
        subjects: {},
        overallScore: 0,
        validScoresCount: 0
      };
      
      // Extract subject scores
      subjectColumns.forEach(col => {
        const subjectName = subjectMap[col];
        const rawValue = rowData[col];
        
        if (rawValue !== undefined && rawValue !== '' && !isNaN(parseFloat(rawValue))) {
          const score = parseFloat(rawValue);
          if (!isNaN(score)) {
            student.subjects[subjectName] = score;
            student.overallScore += score;
            student.validScoresCount++;
          }
        }
      });
      
      // Calculate average if we have valid scores
      if (student.validScoresCount > 0) {
        student.average = student.overallScore / student.validScoresCount;
      } else {
        student.average = 0;
      }
      
      students.push(student);
    }
    
    console.log(`Parsed ${students.length} students from exam ${examNumber}`);
    return students;
    
  } catch (error) {
    console.error(`Error parsing exam ${examNumber}:`, error);
    return [];
  }
};

// Combine data from both exams
const combineExamData = (exam1Data, exam2Data) => {
  const combinedStudents = [];
  
  // Create maps for quick lookup by student number and ID
  const exam1ById = {};
  const exam1ByStudentNumber = {};
  const exam2ById = {};
  const exam2ByStudentNumber = {};
  
  // Populate maps for exam 1
  exam1Data.forEach(student => {
    exam1ById[student.id] = student;
    if (student.studentNumber) {
      exam1ByStudentNumber[student.studentNumber] = student;
    }
  });
  
  // Populate maps for exam 2
  exam2Data.forEach(student => {
    exam2ById[student.id] = student;
    if (student.studentNumber) {
      exam2ByStudentNumber[student.studentNumber] = student;
    }
  });
  
  // First, try to match by student number (most reliable)
  const allStudentNumbers = new Set([
    ...Object.keys(exam1ByStudentNumber),
    ...Object.keys(exam2ByStudentNumber)
  ]);
  
  allStudentNumbers.forEach(studentNumber => {
    const exam1Student = exam1ByStudentNumber[studentNumber];
    const exam2Student = exam2ByStudentNumber[studentNumber];
    
    if (exam1Student && exam2Student) {
      // Found in both exams by student number
      const combinedStudent = {
        id: exam2Student.id || exam1Student.id,
        studentNumber: studentNumber,
        name: exam2Student.name || exam1Student.name,
        birthDate: exam2Student.birthDate || exam1Student.birthDate,
        exam1Subjects: { ...exam1Student.subjects },
        exam2Subjects: { ...exam2Student.subjects },
        exam1Average: exam1Student.average,
        exam2Average: exam2Student.average,
        exam1OverallScore: exam1Student.overallScore,
        exam2OverallScore: exam2Student.overallScore
      };
      
      combinedStudents.push(combinedStudent);
      
      // Remove from ID maps to avoid duplicate processing
      if (exam1Student.id) delete exam1ById[exam1Student.id];
      if (exam2Student.id) delete exam2ById[exam2Student.id];
    }
  });
  
  // Then try to match by ID for remaining students
  const remainingExam1Ids = Object.keys(exam1ById);
  const remainingExam2Ids = Object.keys(exam2ById);
  
  remainingExam1Ids.forEach(id => {
    const exam1Student = exam1ById[id];
    const exam2Student = exam2ById[id];
    
    if (exam1Student && exam2Student) {
      // Found in both exams by ID
      const combinedStudent = {
        id: id,
        studentNumber: exam2Student.studentNumber || exam1Student.studentNumber,
        name: exam2Student.name || exam1Student.name,
        birthDate: exam2Student.birthDate || exam1Student.birthDate,
        exam1Subjects: { ...exam1Student.subjects },
        exam2Subjects: { ...exam2Student.subjects },
        exam1Average: exam1Student.average,
        exam2Average: exam2Student.average,
        exam1OverallScore: exam1Student.overallScore,
        exam2OverallScore: exam2Student.overallScore
      };
      
      combinedStudents.push(combinedStudent);
      delete exam2ById[id];
    }
  });
  
  // Add students only in exam 1
  Object.values(exam1ById).forEach(exam1Student => {
    if (!combinedStudents.find(s => s.studentNumber === exam1Student.studentNumber || s.id === exam1Student.id)) {
      const combinedStudent = {
        id: exam1Student.id,
        studentNumber: exam1Student.studentNumber,
        name: exam1Student.name,
        birthDate: exam1Student.birthDate,
        exam1Subjects: { ...exam1Student.subjects },
        exam2Subjects: {},
        exam1Average: exam1Student.average,
        exam2Average: 0,
        exam1OverallScore: exam1Student.overallScore,
        exam2OverallScore: 0
      };
      
      combinedStudents.push(combinedStudent);
    }
  });
  
  // Add students only in exam 2
  Object.values(exam2ById).forEach(exam2Student => {
    if (!combinedStudents.find(s => s.studentNumber === exam2Student.studentNumber || s.id === exam2Student.id)) {
      const combinedStudent = {
        id: exam2Student.id,
        studentNumber: exam2Student.studentNumber,
        name: exam2Student.name,
        birthDate: exam2Student.birthDate,
        exam1Subjects: {},
        exam2Subjects: { ...exam2Student.subjects },
        exam1Average: 0,
        exam2Average: exam2Student.average,
        exam1OverallScore: 0,
        exam2OverallScore: exam2Student.overallScore
      };
      
      combinedStudents.push(combinedStudent);
    }
  });
  
  console.log(`Combined ${combinedStudents.length} students total`);
  return combinedStudents;
};

// Main function to process both exam files
export const processAllExamData = (exam1File, exam2File) => {
  try {
    console.log('Processing exam files...');
    
    // Parse both files
    const exam1Data = parseExamFile(exam1File, 1);
    const exam2Data = parseExamFile(exam2File, 2);
    
    // Combine data
    const combinedData = combineExamData(exam1Data, exam2Data);
    
    // Process with existing functions
    return processExcelData(combinedData);
  } catch (error) {
    console.error('Error processing exam data:', error);
    return [];
  }
};

// Process student data with statistics
export const processExcelData = (students) => {
  if (!students || students.length === 0) {
    return [];
  }

  return students.map(student => {
    const exam1Avg = student.exam1Average || 0;
    const exam2Avg = student.exam2Average || 0;
    const improvement = exam2Avg - exam1Avg;
    const overallAverage = exam1Avg > 0 && exam2Avg > 0 ? (exam1Avg + exam2Avg) / 2 : Math.max(exam1Avg, exam2Avg);
    
    // Calculate subject improvements
    const subjectImprovements = {};
    const allSubjects = new Set([
      ...Object.keys(student.exam1Subjects || {}),
      ...Object.keys(student.exam2Subjects || {})
    ]);
    
    allSubjects.forEach(subject => {
      const score1 = student.exam1Subjects?.[subject] || 0;
      const score2 = student.exam2Subjects?.[subject] || 0;
      subjectImprovements[subject] = score2 - score1;
    });
    
    // Calculate improvement percentage
    let improvementPercentage = 0;
    if (exam1Avg > 0) {
      improvementPercentage = (improvement / exam1Avg) * 100;
    } else if (improvement > 0) {
      improvementPercentage = 100; // From 0 to positive score
    }
    
    // Determine trend
    let trend = 'stable';
    if (improvement > 0.5) trend = 'improving';
    else if (improvement < -0.5) trend = 'declining';
    
    return {
      ...student,
      fullName: student.name,
      studentId: student.id,
      overallAverage: parseFloat(overallAverage.toFixed(1)),
      improvement: parseFloat(improvement.toFixed(1)),
      improvementPercentage: parseFloat(improvementPercentage.toFixed(1)),
      subjectImprovements,
      trend,
      hasExam1: exam1Avg > 0,
      hasExam2: exam2Avg > 0,
      exam1SubjectsCount: Object.keys(student.exam1Subjects || {}).length,
      exam2SubjectsCount: Object.keys(student.exam2Subjects || {}).length
    };
  });
};

// Calculate comprehensive statistics
export const calculateStatistics = (students) => {
  if (!students || students.length === 0) {
    return {
      average: '0.0',
      topStudent: '',
      topScore: '0.0',
      mostImproved: '',
      mostImprovedScore: '0.0',
      passedCount: 0,
      passRate: '0.0',
      improvementRate: '0.0',
      totalStudents: 0,
      averageImprovement: '0.0',
      subjectAverages: {}
    };
  }

  // Filter students with exam 2 data
  const studentsWithExam2 = students.filter(s => s.exam2Average > 0);
  
  // Calculate class average (based on exam2)
  const exam2Averages = studentsWithExam2.map(s => s.exam2Average);
  const classAverage = exam2Averages.length > 0 
    ? exam2Averages.reduce((sum, avg) => sum + avg, 0) / exam2Averages.length 
    : 0;

  // Find top performer in exam 2
  const topStudent = studentsWithExam2.length > 0
    ? studentsWithExam2.reduce((prev, current) => 
        prev.exam2Average > current.exam2Average ? prev : current
      )
    : { name: '', exam2Average: 0 };

  // Find most improved student (with both exams)
  const studentsWithBothExams = students.filter(s => s.exam1Average > 0 && s.exam2Average > 0);
  const mostImproved = studentsWithBothExams.length > 0
    ? studentsWithBothExams.reduce((prev, current) => {
        const prevImprovement = prev.improvement || 0;
        const currImprovement = current.improvement || 0;
        return currImprovement > prevImprovement ? current : prev;
      })
    : { name: '', improvement: 0 };

  // Calculate pass rate (students with exam2 average >= 5)
  const passedCount = studentsWithExam2.filter(s => s.exam2Average >= 5).length;
  const passRate = studentsWithExam2.length > 0 
    ? (passedCount / studentsWithExam2.length * 100).toFixed(1) 
    : '0.0';

  // Calculate improvement rate (percentage of students who improved)
  const improvedCount = studentsWithBothExams.filter(s => s.improvement > 0).length;
  const improvementRate = studentsWithBothExams.length > 0
    ? (improvedCount / studentsWithBothExams.length * 100).toFixed(1)
    : '0.0';

  // Calculate average improvement
  const totalImprovement = studentsWithBothExams.reduce((sum, s) => sum + s.improvement, 0);
  const averageImprovement = studentsWithBothExams.length > 0
    ? (totalImprovement / studentsWithBothExams.length).toFixed(1)
    : '0.0';

  // Calculate subject averages for exam 2
  const subjectAverages = {};
  const subjectCounts = {};
  
  studentsWithExam2.forEach(student => {
    if (student.exam2Subjects) {
      Object.entries(student.exam2Subjects).forEach(([subject, score]) => {
        if (!subjectAverages[subject]) {
          subjectAverages[subject] = 0;
          subjectCounts[subject] = 0;
        }
        subjectAverages[subject] += score;
        subjectCounts[subject]++;
      });
    }
  });
  
  // Calculate final averages
  Object.keys(subjectAverages).forEach(subject => {
    if (subjectCounts[subject] > 0) {
      subjectAverages[subject] = (subjectAverages[subject] / subjectCounts[subject]).toFixed(1);
    }
  });

  return {
    average: classAverage.toFixed(2),
    topStudent: topStudent.name || '',
    topScore: (topStudent.exam2Average || 0).toFixed(1),
    mostImproved: mostImproved.name || '',
    mostImprovedScore: (mostImproved.improvement || 0).toFixed(1),
    passedCount,
    passRate,
    improvementRate,
    averageImprovement,
    totalStudents: students.length,
    studentsWithExam2: studentsWithExam2.length,
    studentsWithBothExams: studentsWithBothExams.length,
    subjectAverages,
    performanceDistribution: calculatePerformanceDistribution(studentsWithExam2)
  };
};

// Calculate performance distribution
const calculatePerformanceDistribution = (students) => {
  const distribution = {
    excellent: 0, // 9-10
    veryGood: 0,  // 8-8.9
    good: 0,      // 6-7.9
    average: 0,   // 5-5.9
    weak: 0       // 0-4.9
  };
  
  students.forEach(student => {
    const avg = student.exam2Average;
    if (avg >= 9) distribution.excellent++;
    else if (avg >= 8) distribution.veryGood++;
    else if (avg >= 6) distribution.good++;
    else if (avg >= 5) distribution.average++;
    else distribution.weak++;
  });
  
  return distribution;
};

// Generate smart comments for students
export const generateSmartComments = (students) => {
  if (!students || students.length === 0) return [];

  return students.map(student => {
    const exam1Avg = student.exam1Average || 0;
    const exam2Avg = student.exam2Average || 0;
    const improvement = student.improvement || 0;
    const overallAverage = student.overallAverage || 0;
    
    let performanceLevel = '';
    let overallComment = '';
    let improvementAdvice = '';
    let parentGuidance = '';
    let strengths = [];
    let weaknesses = [];
    
    // Determine performance level based on exam 2
    const performanceScore = exam2Avg > 0 ? exam2Avg : exam1Avg;
    
    if (performanceScore >= 9) {
      performanceLevel = 'ممتاز';
      overallComment = 'أداء متميز! طالب متفوق ويظهر فهماً عميقاً للمواد.';
      strengths = ['التفوق في جميع المواد', 'القدرة على التحليل', 'الالتزام بالدراسة', 'المبادرة والإبداع'];
    } else if (performanceScore >= 8) {
      performanceLevel = 'جيد جداً';
      overallComment = 'أداء جيد جداً، يظهر تفوقاً ملحوظاً في أغلب المواد.';
      strengths = ['الجهد المبذول', 'الفهم الجيد', 'التحسن المستمر', 'الانتظام في الدراسة'];
    } else if (performanceScore >= 6) {
      performanceLevel = 'جيد';
      overallComment = 'أداء جيد، لكن هناك مساحة للتحسين في بعض المواد.';
      strengths = ['المثابرة', 'التحسن الملحوظ', 'الجهد الواضح'];
      weaknesses = ['التركيز في بعض المواد', 'المذاكرة المنتظمة', 'الدقة في الإجابة'];
    } else if (performanceScore >= 5) {
      performanceLevel = 'مقبول';
      overallComment = 'أداء مقبول، يحتاج إلى مزيد من الجهد والمتابعة.';
      weaknesses = ['الفهم العميق', 'الاستعداد للامتحانات', 'التركيز', 'تنظيم الوقت'];
    } else {
      performanceLevel = 'يحتاج متابعة';
      overallComment = 'يحتاج إلى دعم إضافي ومتابعة مستمرة لتحسين المستوى.';
      weaknesses = ['الأساسيات', 'التركيز', 'الدافعية للتعلم', 'المهارات الأساسية'];
    }
    
    // Improvement advice based on trend
    if (improvement > 1.5) {
      improvementAdvice = 'تحسن ممتاز! استمر في هذا النهج الممتاز والتقدم واضح ويجب الحفاظ عليه.';
      parentGuidance = 'الاستمرار في التشجيع والدعم سيكون له أثر إيجابي كبير على تحصيل الطالب.';
    } else if (improvement > 0.5) {
      improvementAdvice = 'هناك تحسن ملحوظ، يمكنك تحقيق أفضل من خلال تنظيم وقت المذاكرة والتركيز على نقاط الضعف.';
      parentGuidance = 'المتابعة اليومية وتشجيع الطالب على المشاركة ستساعد في تحسين النتائج بشكل أكبر.';
    } else if (improvement > -0.5) {
      improvementAdvice = 'المستوى ثابت، يمكنك التحسن من خلال التركيز على نقاط الضعف وزيادة ساعات المذاكرة.';
      parentGuidance = 'التشجيع على المشاركة في الفصل وتوفير بيئة مناسبة للدراسة سيساعد في التحسن.';
    } else if (improvement > -1.5) {
      improvementAdvice = 'هناك تراجع بسيط، يجب مراجعة طريقة المذاكرة والتركيز على المواد الضعيفة.';
      parentGuidance = 'يحتاج إلى متابعة أقوى وتحديد أسباب التراجع ومعالجتها مع المعلم.';
    } else {
      improvementAdvice = 'تراجع واضح في المستوى، يجب مراجعة شاملة لطريقة الدراسة والاستعانة بمعلم خاص إذا لزم الأمر.';
      parentGuidance = 'يحتاج إلى برنامج متابعة مكثف ودروس تقوية فردية واجتماع مع المرشد الأكاديمي.';
    }
    
    // Subject-specific comments
    const subjectComments = {};
    const subjects = student.exam2Subjects || student.exam1Subjects || {};
    
    Object.entries(subjects).forEach(([subject, score]) => {
      if (score >= 9) {
        subjectComments[subject] = 'ممتاز في هذا المجال، مهارات متقدمة وفهم عميق.';
      } else if (score >= 8) {
        subjectComments[subject] = 'جيد جداً، إتقان للمهارات الأساسية مع قدرة على التحليل.';
      } else if (score >= 6) {
        subjectComments[subject] = 'مستوى جيد، يحتاج للمزيد من التدريب والتطبيق العملي.';
      } else if (score >= 5) {
        subjectComments[subject] = 'مستوى مقبول، يحتاج لتركيز أكثر على الأساسيات.';
      } else {
        subjectComments[subject] = 'يحتاج دعم إضافي في هذا المجال، مراجعة شاملة للأساسيات مطلوبة.';
      }
    });
    
    // Identify specific strengths and weaknesses from subjects
    Object.entries(subjects).forEach(([subject, score]) => {
      if (score >= 8 && !strengths.includes(subject)) {
        strengths.push(subject);
      } else if (score < 5 && !weaknesses.includes(subject)) {
        weaknesses.push(subject);
      }
    });
    
    // Motivational quotes
    const motivationalQuotes = [
      'النجاح هو مجموع الجهود الصغيرة المتكررة يومياً.',
      'التعليم هو أقوى سلاح يمكنك استخدامه لتغيير العالم.',
      'لا تتوقع نتائج مختلفة إذا واصلت فعل الأشياء نفسها.',
      'التميز ليس مهارة، بل عادة.',
      'العقل ليس وعاءً يجب أن نملأه، بل ناراً يجب أن نوقظها.',
      'المعرفة قوة، والتعلم هو الوسيلة لاكتساب هذه القوة.',
      'لا تيأس، فعادة ما يكون اليأس هو آخر مفتاح في سلسلة المفاتيح التي تفتح الأبواب.'
    ];
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    
    return {
      ...student,
      comments: overallComment,
      performanceLevel,
      improvementAdvice,
      parentGuidance,
      strengths: strengths.slice(0, 3),
      weaknesses: weaknesses.slice(0, 3),
      subjectComments,
      motivationalQuote: randomQuote,
      needsAttention: performanceScore < 5 || improvement < -1
    };
  });
};

// Predict next exam performance
export const predictNextExam = (student) => {
  const exam1Avg = student.exam1Average || 0;
  const exam2Avg = student.exam2Average || 0;
  
  if (exam1Avg === 0 && exam2Avg === 0) return 5.0;
  
  const improvement = exam2Avg - exam1Avg;
  
  // Base prediction on current performance with weighted factors
  let prediction = exam2Avg > 0 ? exam2Avg : exam1Avg;
  
  // Apply improvement trend
  if (improvement > 0) {
    prediction += improvement * 0.6; // 60% of current improvement rate
  } else if (improvement < 0) {
    prediction += improvement * 0.3; // 30% of negative trend
  }
  
  // Consider overall performance level
  if (prediction >= 8) {
    // High performers: slight improvement or maintenance
    prediction += (Math.random() * 0.5) - 0.1; // -0.1 to +0.4
  } else if (prediction >= 6) {
    // Average performers: moderate potential for improvement
    prediction += (Math.random() * 0.8) - 0.3; // -0.3 to +0.5
  } else {
    // Low performers: higher potential for improvement with intervention
    prediction += (Math.random() * 1.2) - 0.2; // -0.2 to +1.0
  }
  
  // Ensure prediction is within 0-10 range
  prediction = Math.max(0, Math.min(10, prediction));
  
  // Round to nearest 0.5 for realistic scores
  prediction = Math.round(prediction * 2) / 2;
  
  return parseFloat(prediction.toFixed(1));
};

// Export data to Excel
export const exportToExcel = (students, statistics) => {
  try {
    // Prepare data for export
    const exportData = students.map(student => {
      const row = {
        'رقم التلميذ': student.studentNumber,
        'اسم التلميذ': student.name,
        'تاريخ الميلاد': student.birthDate,
        'متوسط الامتحان الأول': student.exam1Average.toFixed(1),
        'متوسط الامتحان الثاني': student.exam2Average.toFixed(1),
        'التحسن': student.improvement.toFixed(1),
        'النسبة المئوية للتحسن': `${student.improvementPercentage.toFixed(1)}%`,
        'المستوى العام': student.trend === 'improving' ? 'متقدم' : student.trend === 'declining' ? 'متراجع' : 'مستقر',
        'الملاحظات': student.comments || ''
      };
      
      // Add subject scores
      const subjects = student.exam2Subjects || student.exam1Subjects || {};
      Object.entries(subjects).forEach(([subject, score]) => {
        row[subject] = score.toFixed(1);
      });
      
      return row;
    });
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Add statistics sheet
    const statsData = [
      ['إحصائيات الفصل'],
      ['المتوسط العام', statistics.average],
      ['أعلى طالب', statistics.topStudent],
      ['أعلى درجة', statistics.topScore],
      ['أكثر طالب تحسناً', statistics.mostImproved],
      ['مقدار التحسن', statistics.mostImprovedScore],
      ['عدد الناجحين', statistics.passedCount],
      ['نسبة النجاح', `${statistics.passRate}%`],
      ['نسبة التحسن', `${statistics.improvementRate}%`],
      ['إجمالي عدد الطلاب', statistics.totalStudents]
    ];
    
    const statsWs = XLSX.utils.aoa_to_sheet(statsData);
    
    // Add sheets to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'الطلاب');
    XLSX.utils.book_append_sheet(wb, statsWs, 'الإحصائيات');
    
    // Generate file
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    
    return url;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return null;
  }
};

// Utility function to read Excel file
export const readExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

// Default export
export default {
  processAllExamData,
  processExcelData,
  calculateStatistics,
  generateSmartComments,
  predictNextExam,
  exportToExcel,
  readExcelFile
};