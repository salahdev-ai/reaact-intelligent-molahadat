import * as XLSX from 'xlsx';

// Utility: Read file as ArrayBuffer
export const readExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(new Uint8Array(e.target.result));
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

// Parse a single exam file
const parseExamFile = (fileData, examNumber) => {
  try {
    const workbook = XLSX.read(fileData, { type: 'array', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    
    let headerRowIndex = -1;
    for (let i = 0; i < data.length; i++) {
      if (data[i] && (data[i][1] === "ID" || data[i][1] === "رقم")) {
        headerRowIndex = i;
        break;
      }
    }
    
    if (headerRowIndex === -1) return [];
    
    const subjectHeaderRow = data[headerRowIndex];
    const subjectMap = {};
    const subjectColumns = [];
    
    for (let col = 5; col < subjectHeaderRow.length; col++) {
      const cellValue = subjectHeaderRow[col];
      
      if (cellValue && typeof cellValue === 'string') {
        const headerText = cellValue.toString().trim();
        
        if (
            headerText.includes('تاريخ') || 
            headerText.includes('Date') || 
            headerText.includes('birth') ||
            headerText.includes('ملاحظات') ||
            headerText.includes('Moyenne') ||
            headerText.includes('معدل')
        ) {
            continue;
        }

        if (headerText.length > 1 && !headerText.includes('#') && !headerText.match(/^\d+$/)) {
           subjectMap[col] = headerText;
           subjectColumns.push(col);
        }
      }
    }

    const students = [];
    
    for (let row = headerRowIndex + 2; row < data.length; row++) {
      const rowData = data[row];
      if (!rowData || !rowData[1]) continue;
      
      const student = {
        id: rowData[1].toString().trim(),
        studentNumber: rowData[2] ? rowData[2].toString().trim() : '',
        name: rowData[3] ? rowData[3].toString().trim() : 'Unknown',
        dateOfBirth: rowData[5] ? formatDate(rowData[5]) : '-',
        subjects: {},
        overallScore: 0,
        validScoresCount: 0
      };
      
      subjectColumns.forEach(col => {
        const rawValue = rowData[col];
        if (rawValue !== undefined && rawValue !== '' && typeof rawValue !== 'object') {
          let score = parseFloat(rawValue);
          
          if (!isNaN(score) && score >= 0 && score <= 10) {
            student.subjects[subjectMap[col]] = score;
            student.overallScore += score;
            student.validScoresCount++;
          }
        }
      });
      
      student.average = student.validScoresCount > 0 
        ? parseFloat((student.overallScore / student.validScoresCount).toFixed(2)) 
        : 0;
        
      if (student.id) students.push(student);
    }
    return students;
  } catch (error) {
    console.error(`Error parsing exam ${examNumber}:`, error);
    return [];
  }
};

// Helper to format date
const formatDate = (dateInput) => {
    if (dateInput instanceof Date) {
        return dateInput.toISOString().split('T')[0];
    }
    return dateInput;
};

// Combine Data from both exams
const combineExamData = (exam1Data, exam2Data) => {
  const map = new Map();

  const processList = (list, examNum) => {
    list.forEach(s => {
      const key = s.id || s.name; 
      if (!map.has(key)) {
        map.set(key, {
          id: s.id,
          studentNumber: s.studentNumber,
          name: s.name,
          dateOfBirth: s.dateOfBirth,
          exam1Subjects: {},
          exam2Subjects: {},
          exam1SubjectScores: {},
          exam2SubjectScores: {},
          exam1Average: 0,
          exam2Average: 0,
          exam1RawScores: [],
          exam2RawScores: []
        });
      }
      const entry = map.get(key);
      if (examNum === 1) {
        entry.exam1Subjects = s.subjects;
        entry.exam1SubjectScores = s.subjects;
        entry.exam1Average = s.average;
        entry.exam1RawScores = Object.values(s.subjects);
      } else {
        entry.exam2Subjects = s.subjects;
        entry.exam2SubjectScores = s.subjects;
        entry.exam2Average = s.average;
        entry.exam2RawScores = Object.values(s.subjects);
      }
    });
  };

  processList(exam1Data, 1);
  processList(exam2Data, 2);

  return Array.from(map.values());
};

// Calculate Standard Deviation
const calculateStandardDeviation = (values) => {
  if (values.length === 0) return 0;
  const avg = values.reduce((a, b) => a + b) / values.length;
  const squareDiffs = values.map(value => Math.pow(value - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b) / values.length;
  return Math.sqrt(avgSquareDiff).toFixed(2);
};

// Calculate Coefficient of Variation (consistency)
const calculateConsistency = (scores) => {
  if (scores.length === 0) return 0;
  const mean = scores.reduce((a, b) => a + b) / scores.length;
  if (mean === 0) return 0;
  const stdDev = parseFloat(calculateStandardDeviation(scores));
  return (stdDev / mean).toFixed(2);
};

// Improved Machine Learning Predictor
export const predictSuccess = (student) => {
  const exam1Avg = student.exam1Average || 0;
  const exam2Avg = student.exam2Average || 0;
  const improvement = exam2Avg - exam1Avg;
  
  // Get all subject scores from both exams
  const allScores = [...(student.exam1RawScores || []), ...(student.exam2RawScores || [])];
  
  // Calculate features with better normalization
  const features = {
    currentAvg: exam2Avg || exam1Avg,
    improvementRate: improvement,
    consistency: parseFloat(calculateConsistency(allScores.length > 0 ? allScores : [exam2Avg])),
    weakSubjects: Object.values(student.exam2SubjectScores || {}).filter(s => s < 5).length,
    strongSubjects: Object.values(student.exam2SubjectScores || {}).filter(s => s >= 8).length,
    totalSubjects: Object.keys(student.exam2SubjectScores || {}).length,
    trend: improvement > 0 ? 1 : (improvement < 0 ? -1 : 0)
  };
  
  // IMPROVED PREDICTION MODEL with balanced weights
  let predictionScore = 0;
  
  // Base score (current performance) - 40%
  predictionScore += features.currentAvg * 0.4;
  
  // Improvement bonus - 25% (max +2.5 points)
  if (improvement > 0) {
    predictionScore += Math.min(improvement * 2.5, 2.5);
  }
  
  // Consistency bonus - 20% (less variation is better)
  const consistencyScore = Math.max(0, 2 - (features.consistency * 2));
  predictionScore += consistencyScore;
  
  // Strong subjects bonus - 10%
  if (features.totalSubjects > 0) {
    const strongSubjectRatio = features.strongSubjects / features.totalSubjects;
    predictionScore += strongSubjectRatio * 1;
  }
  
  // Weak subjects penalty - 5%
  if (features.totalSubjects > 0) {
    const weakSubjectPenalty = features.weakSubjects / features.totalSubjects;
    predictionScore -= weakSubjectPenalty * 0.5;
  }
  
  // Cap between 0-10
  predictionScore = Math.max(0, Math.min(10, predictionScore));
  
  // Calculate success probability (more realistic distribution)
  let successProbability = (predictionScore / 10) * 100;
  
  // Adjust based on improvement trend
  if (improvement > 1) successProbability += 10;
  if (improvement < -1) successProbability -= 15;
  
  // Cap probability
  successProbability = Math.max(0, Math.min(100, successProbability));
  
  // Improved risk level calculation
  let riskLevel = 'low';
  if (successProbability < 50) {
    riskLevel = 'high';
  } else if (successProbability < 75) {
    riskLevel = 'medium';
  }
  
  // Next exam prediction with realistic improvement
  const baseForPrediction = exam2Avg || exam1Avg || 5;
  let nextExamPrediction = baseForPrediction;
  
  if (improvement > 0) {
    // Positive momentum - continue improvement but diminishing returns
    nextExamPrediction += improvement * 0.5;
  } else if (improvement < 0) {
    // Negative trend - might recover partially
    nextExamPrediction += improvement * 0.3;
  }
  
  // Add random variation (±0.5) for realism
  const randomVariation = (Math.random() - 0.5) * 1;
  nextExamPrediction += randomVariation;
  
  // Cap between 0-10
  nextExamPrediction = Math.max(0, Math.min(10, nextExamPrediction));
  
  // Confidence calculation
  const confidence = Math.max(30, Math.min(95, 
    70 + (improvement * 5) - (features.consistency * 10)
  ));
  
  return {
    predictedScore: predictionScore.toFixed(2),
    successProbability: successProbability.toFixed(1),
    riskLevel,
    nextExamPrediction: nextExamPrediction.toFixed(2),
    confidence: confidence.toFixed(0),
    features,
    recommendations: generateRecommendations(features, improvement, exam2Avg)
  };
};

// Generate personalized recommendations
const generateRecommendations = (features, improvement, currentAvg) => {
  const recs = [];
  
  if (features.weakSubjects > 0) {
    recs.push(`حاجة لدعم في ${features.weakSubjects} مادة`);
  }
  
  if (features.consistency > 0.5) {
    recs.push("يحتاج لتحسين الاستقرار في الأداء بين المواد");
  } else if (features.consistency < 0.2) {
    recs.push("أداء متوازن بين المواد");
  }
  
  if (improvement > 1) {
    recs.push("مسار تحسن ممتاز، استمر في نفس النهج");
  } else if (improvement > 0) {
    recs.push("تحسن إيجابي، يمكن الاستمرار في التقدم");
  } else if (improvement < -1) {
    recs.push("انتباه: تراجع في الأداء يحتاج لمقابلة دعم");
  } else if (improvement < 0) {
    recs.push("انخفاض طفيف، يحتاج لمتابعة");
  }
  
  if (features.strongSubjects >= 2) {
    recs.push("لديه مواهب واضحة يمكن استثمارها أكثر");
  }
  
  if (currentAvg < 5) {
    recs.push("يحتاج خطة دعم مكثفة للمواد الأساسية");
  } else if (currentAvg < 6) {
    recs.push("يحتاج تركيز إضافي على نقاط الضعف");
  } else if (currentAvg > 8) {
    recs.push("متفوق، يمكن تحدي نفسه بمهام إضافية");
  }
  
  return recs;
};

// Enhanced Smart Comment Generator
export const generateAdvancedComments = (student) => {
  const exam2Avg = student.exam2Average || 0;
  const exam1Avg = student.exam1Average || 0;
  const improvement = student.improvement || 0;
  const prediction = predictSuccess(student);
  
  let overallComment = "";
  let detailedComments = [];
  
  // Overall performance assessment
  if (exam2Avg >= 9) {
    overallComment = "أداء استثنائي ومتميز! الطالب يظهر فهماً عميقاً للمواد ويعمل بكفاءة عالية.";
  } else if (exam2Avg >= 8) {
    overallComment = "أداء ممتاز، الطالب مجتهد ومنظم في دراسته.";
  } else if (exam2Avg >= 7) {
    overallComment = "أداء جيد جداً، مع إمكانية التحسين في بعض الجوانب.";
  } else if (exam2Avg >= 6) {
    overallComment = "أداء مقبول، يحتاج لمزيد من التركيز والجهد.";
  } else if (exam2Avg >= 5) {
    overallComment = "أداء على الحد الأدنى، يحتاج لدعم وتوجيه مكثف.";
  } else {
    overallComment = "أداء ضعيف، يحتاج لخطة دعم فورية وتدخل تربوي خاص.";
  }
  
  // Trend analysis
  if (improvement > 2) {
    detailedComments.push("تحسن مذهل مقارنة بالفرض الأول، دليل على مجهود كبير.");
  } else if (improvement > 1) {
    detailedComments.push("تحسن ملحوظ في الأداء، استمر في نفس الاتجاه.");
  } else if (improvement > 0) {
    detailedComments.push("تحسن طفيف، يمكن تعزيزه بالمزيد من الجهد.");
  } else if (improvement < -1) {
    detailedComments.push("تراجع في المستوى، يحتاج لتحليل أسباب هذا الانخفاض.");
  } else if (improvement < 0) {
    detailedComments.push("انخفاض طفيف، يحتاج لمراجعة الاستراتيجيات الدراسية.");
  }
  
  // Subject-specific analysis
  const weakSubjects = Object.entries(student.exam2SubjectScores || {})
    .filter(([_, score]) => score < 5)
    .map(([subject]) => subject);
    
  const strongSubjects = Object.entries(student.exam2SubjectScores || {})
    .filter(([_, score]) => score >= 8)
    .map(([subject]) => subject);
    
  if (weakSubjects.length > 0) {
    detailedComments.push(`ضعف في: ${weakSubjects.join('، ')} - يحتاج لمراجعة مع المدرس.`);
  }
  
  if (strongSubjects.length > 0) {
    detailedComments.push(`تميز في: ${strongSubjects.join('، ')} - يمكن الاعتماد على هذه المواهب.`);
  }
  
  // Balance analysis
  if (weakSubjects.length > 0 && strongSubjects.length > 0) {
    detailedComments.push("أداء غير متوازن بين المواد، يحتاج لتقوية النقاط الضعيفة.");
  }
  
  // Prediction insights
  if (prediction.successProbability >= 80) {
    detailedComments.push("توقعات نجاح عالية جداً مع الاستمرار في نفس المستوى.");
  } else if (prediction.successProbability >= 60) {
    detailedComments.push("توقعات نجاح جيدة مع تحسين بسيط في الأداء.");
  } else if (prediction.successProbability >= 40) {
    detailedComments.push("توقعات نجاح متوسطة، يحتاج لتحسين في المجالات الضعيفة.");
  } else {
    detailedComments.push("خطر التعثر مرتفع، يحتاج لتدخل سريع ودعم مكثف.");
  }
  
  return {
    overallComment,
    detailedComments,
    weakSubjects,
    strongSubjects,
    consistencyScore: parseFloat(calculateConsistency(student.exam2RawScores || []))
  };
};

// Smart Comments and Advice Generator
class CommentGenerator {
  static motivationalQuotes = [
    "النجاح هو مجموع الجهود الصغيرة المتكررة يومياً",
    "التعليم هو أقوى سلاح يمكنك استخدامه لتغيير العالم",
    "التميز ليس مهارة، إنه موقف",
    "العقول العظيمة لديها أهداف، بينما الآخرون لديهم أمنيات",
    "لا تنتظر الفرصة، اصنعها",
    "التحديات هي ما تجعل الحياة مثيرة للاهتمام",
    "المستقبل ينتمي لأولئك الذين يؤمنون بجمال أحلامهم"
  ];
  
  static subjectAdvice = {
    'رياضيات': 'تدرب على حل مسائل إضافية يومياً لتعزيز المهارات الرياضية',
    'فيزياء': 'افهم المبادئ الأساسية ثم تطبيقها في مسائل عملية',
    'علوم': 'اربط بين النظريات والتجارب العملية لفهم أفضل',
    'لغة عربية': 'اقرأ يومياً وحاول كتابة فقرات صغيرة لتحسين المهارات',
    'لغة فرنسية': 'استمع وتحدث بالفرنسية يومياً لتحسين النطق والفهم',
    'تاريخ': 'اربط الأحداث التاريخية بسياقها الزمني لفهم أفضل',
    'جغرافيا': 'استخدم الخرائط والصور لتذكر المعلومات الجغرافية',
    'فلسفة': 'ناقش الأفكار مع زملائك لفهم أعمق للمفاهيم',
    'إعلام آلي': 'تدرب على التطبيق العملي للبرمجة والمفاهيم',
    'تربية إسلامية': 'حفظ الآيات والأحاديث مع فهم معانيها',
    'تربية بدنية': 'مارس الرياضة بانتظام لتحسين التركيز والصحة',
    'موسيقى': 'تدرب على العزف والاستماع للموسيقى الكلاسيكية'
  };
  
  static commentTemplates = {
    'رياضيات': {
      '10': 'ممتاز! فهم رياضي ممتاز وقدرة على حل المسائل المعقدة',
      '9': 'جيد جداً، يمكنك تحسين سرعة الحل ودقة الخطوات',
      '8': 'أداء جيد، ركز على فهم النظريات وتطبيقها',
      '7': 'مقبول، حاول حل مسائل أكثر تنوعاً',
      '6': 'بحاجة للتحسين، راجع الأساسيات وحل تمارين إضافية',
      '5': 'ضعيف، ابدأ بالأساسيات وتدرب يومياً'
    },
    'فيزياء': {
      '10': 'ممتاز في الفيزياء! فهم عميق للمفاهيم والتطبيقات',
      '9': 'جيد جداً، يمكنك تحسين مهارات التحليل والتجارب',
      '8': 'أداء جيد، ركز على ربط النظريات بالتطبيقات العملية',
      '7': 'مقبول، حاول فهم المبادئ الأساسية أولاً',
      '6': 'بحاجة للتحسين، راجع القوانين وحل تمارين تطبيقية',
      '5': 'ضعيف، ابدأ بالمفاهيم الأساسية وتدرب على المسائل البسيطة'
    },
    'علوم': {
      '10': 'ممتاز في العلوم! فهم شامل للمفاهيم والتجارب',
      '9': 'جيد جداً، يمكنك تحسين مهارات الملاحظة والتحليل',
      '8': 'أداء جيد، ركز على فهم التجارب العملية',
      '7': 'مقبول، حاول ربط المفاهيم بالحياة اليومية',
      '6': 'بحاجة للتحسين، راجع الدروس وحل تمارين إضافية',
      '5': 'ضعيف، ابدأ بالمفاهيم الأساسية وتدرب على الفهم'
    },
    'لغة عربية': {
      '10': 'ممتاز! لغتك العربية قوية وفهم ممتاز للنصوص',
      '9': 'جيد جداً، يمكنك تحسين مهارات التعبير والإملاء',
      '8': 'أداء جيد، ركز على القراءة والكتابة اليومية',
      '7': 'مقبول، حاول قراءة نصوص متنوعة',
      '6': 'بحاجة للتحسين، راجع القواعد وحاول الكتابة يومياً',
      '5': 'ضعيف، ابدأ بالقراءة البسيطة وتدرب على الكتابة'
    },
    'لغة فرنسية': {
      '10': 'ممتاز في الفرنسية! مهارات لغوية ممتازة',
      '9': 'جيد جداً، يمكنك تحسين النطق والمحادثة',
      '8': 'أداء جيد، ركز على المفردات والقواعد',
      '7': 'مقبول، حاول الاستماع والتحدث بالفرنسية',
      '6': 'بحاجة للتحسين، راجع المفردات الأساسية',
      '5': 'ضعيف، ابدأ بالمفردات البسيطة والعبارات الشائعة'
    }
  };
  
  static generateStudentComments(student) {
    const subjectComments = {};
    const subjectAdvice = {};
    
    // Generate comments for each subject from exam 2
    if (student.exam2SubjectScores) {
      Object.entries(student.exam2SubjectScores).forEach(([subject, score]) => {
        const scoreKey = this.getScoreKey(score);
        const template = this.commentTemplates[subject] || this.commentTemplates['رياضيات']; // Fallback
        
        let comment = template[scoreKey] || 'أداء مقبول، يمكن التحسين';
        
        // Add improvement context if we have exam 1 score
        if (student.exam1SubjectScores && student.exam1SubjectScores[subject] !== undefined) {
          const previousScore = student.exam1SubjectScores[subject];
          const improvement = score - previousScore;
          
          if (improvement > 2) {
            comment += ' تحسن مذهل! استمر في هذا التقدم.';
          } else if (improvement > 1) {
            comment += ' هناك تحسن ملحوظ، أحسنت!';
          } else if (improvement > 0) {
            comment += ' هناك تحسن طفيف، يمكن تعزيزه.';
          } else if (improvement < 0) {
            comment += ' هناك تراجع، راجع الدروس السابقة.';
          }
        }
        
        subjectComments[subject] = comment;
        
        // Add subject advice
        subjectAdvice[subject] = this.subjectAdvice[subject] || 'تدرب يومياً على هذا المادة لتحسين مستواك';
      });
    }
    
    // Generate overall comment
    const overallAverage = student.overallAverage || 0;
    const overallComment = this.generateOverallComment(student);
    
    // Generate improvement advice
    const improvementAdvice = this.generateImprovementAdvice(student);
    
    // Generate parent guidance
    const parentGuidance = this.generateParentGuidance(student);
    
    // Get random motivational quote
    const randomQuote = this.motivationalQuotes[
      Math.floor(Math.random() * this.motivationalQuotes.length)
    ];
    
    // Performance level
    const performanceLevel = this.getPerformanceLevelFromAverage(overallAverage);
    
    return {
      studentName: student.name,
      studentNumber: student.studentNumber,
      overallAverage: overallAverage,
      subjectComments,
      subjectAdvice,
      overallComment,
      motivationalQuote: randomQuote,
      improvementAdvice,
      parentGuidance,
      performanceLevel,
      weakSubjects: Object.entries(student.exam2SubjectScores || {})
        .filter(([_, score]) => score < 5)
        .map(([subject]) => subject),
      strongSubjects: Object.entries(student.exam2SubjectScores || {})
        .filter(([_, score]) => score >= 8)
        .map(([subject]) => subject)
    };
  }
  
  static getScoreKey(score) {
    if (score >= 9.5) return '10';
    if (score >= 8.5) return '9';
    if (score >= 7.5) return '8';
    if (score >= 6.5) return '7';
    if (score >= 5.5) return '6';
    return '5';
  }
  
  static generateOverallComment(student) {
    const average = student.overallAverage || 0;
    const improvement = student.improvement || 0;
    
    if (average >= 9) {
      return `أداء استثنائي ومتفوق (${average.toFixed(1)}/10). الطالب يظهر فهماً عميقاً للمواد ويعمل بكفاءة عالية. ${improvement > 0 ? 'هناك تحسن إيجابي في الأداء.' : 'الأداء مستقر على مستوى عالي.'}`;
    } else if (average >= 8) {
      return `أداء ممتاز (${average.toFixed(1)}/10). الطالب مجتهد ومنظم في دراسته. ${improvement > 0 ? 'هناك تحسن ملحوظ في المستوى.' : 'يحتاج للحفاظ على هذا المستوى.'}`;
    } else if (average >= 7) {
      return `أداء جيد جداً (${average.toFixed(1)}/10). ${improvement > 0 ? 'هناك تحسن إيجابي، استمر في نفس النهج.' : 'الأداء مستقر، يمكن تحسينه بالمزيد من الجهد.'}`;
    } else if (average >= 6) {
      return `أداء جيد (${average.toFixed(1)}/10). ${improvement > 0 ? 'هناك تحسن طفيف، يمكن تعزيزه.' : 'يحتاج لمزيد من التركيز والجهد.'}`;
    } else if (average >= 5) {
      return `أداء مقبول (${average.toFixed(1)}/10). ${improvement > 0 ? 'هناك تحسن لكنه لا يزال محدوداً.' : 'يحتاج لدعم إضافي وخطة دراسية منظمة.'}`;
    } else {
      return `أداء ضعيف (${average.toFixed(1)}/10). يحتاج لخطة دعم مكثفة وتدخل تربوي خاص. ${improvement > 0 ? 'هناك تحسن إيجابي لكن يحتاج الاستمرار.' : 'يحتاج لتغيير استراتيجية التعلم.'}`;
    }
  }
  
  static generateImprovementAdvice(student) {
    const improvement = student.improvement || 0;
    const average = student.overallAverage || 0;
    
    // Find weakest subject
    let weakestSubject = null;
    let weakestScore = 10;
    
    if (student.exam2SubjectScores) {
      Object.entries(student.exam2SubjectScores).forEach(([subject, score]) => {
        if (score < weakestScore) {
          weakestScore = score;
          weakestSubject = subject;
        }
      });
    }
    
    if (weakestSubject && weakestScore < 5) {
      return `أهم مجال للتحسين: ${weakestSubject} (${weakestScore.toFixed(1)}/10). ${this.subjectAdvice[weakestSubject] || 'يحتاج تركيز إضافي ومتابعة مع المدرس.'}`;
    }
    
    if (improvement > 1.5) {
      return 'مسار تحسن ممتاز! استمر في نفس النهج ويمكنك تحدي نفسك بمهام أكثر صعوبة.';
    } else if (improvement > 0) {
      return 'هناك تحسن إيجابي، يمكنك تعزيزه بمزيد من التركيز على المواد الأضعف.';
    } else if (improvement < -1) {
      return 'انتبه! هناك تراجع في الأداء. راجع أسباب هذا الانخفاض وعدّل استراتيجية التعلم.';
    }
    
    if (average >= 7) {
      return 'الأداء جيد، يمكنك تحسينه بالتركيز على التفوق في المواد القوية.';
    } else if (average >= 5) {
      return 'يحتاج لمزيد من الجهد المنتظم والمراجعة اليومية.';
    } else {
      return 'يحتاج خطة دعم مكثفة ومراجعة شاملة للمواد الأساسية.';
    }
  }
  
  static generateParentGuidance(student) {
    const average = student.overallAverage || 0;
    const improvement = student.improvement || 0;
    
    if (average >= 8) {
      return 'شجعوا طفلكم على الاستمرار في التفوق. وفر له بيئة مناسبة للدراسة ومواد تعليمية إضافية تناسب اهتماماته.';
    } else if (average >= 6) {
      return 'تابعوا دروس طفلكم بانتظام وساعدوه في تنظيم وقت الدراسة. شجعوه على القراءة وحل التمارين الإضافية.';
    } else if (average >= 5) {
      return 'طفلكم يحتاج متابعة يومية. خصصوا وقتاً للمراجعة معه واستشيروا المعلم للوقوف على نقاط الضعف.';
    } else {
      return 'طفلكم يحتاج دعم إضافي عاجل. تواصلوا مع المدرس لوضع خطة دعم مكثفة وخصصوا وقتاً يومياً للمراجعة.';
    }
  }
  
  static getPerformanceLevelFromAverage(average) {
    if (average >= 9) return 'ممتاز';
    if (average >= 8) return 'جيد جدا';
    if (average >= 7) return 'جيد';
    if (average >= 6) return 'مقبول';
    if (average >= 5) return 'ضعيف';
    return 'ضعيف جداً';
  }
}

// Enhanced Student Analytics
export const calculateAdvancedAnalytics = (students) => {
  if (!students.length) return null;
  
  // First, process students with predictions
  const studentsWithAnalytics = students.map(student => {
    const comments = generateAdvancedComments(student);
    const prediction = predictSuccess(student);
    
    return {
      ...student,
      ...comments,
      prediction,
      consistency: comments.consistencyScore,
      learningProfile: determineLearningProfile(student, comments, prediction)
    };
  });
  
  // Calculate class statistics for better risk assessment
  const classAverages = {
    exam1: students.reduce((sum, s) => sum + (s.exam1Average || 0), 0) / students.length,
    exam2: students.reduce((sum, s) => sum + (s.exam2Average || 0), 0) / students.length,
    overall: students.reduce((sum, s) => sum + (s.overallAverage || 0), 0) / students.length
  };
  
  // Calculate distribution based on RELATIVE performance
  const successDistribution = {
    high: 0,
    medium: 0,
    low: 0
  };
  
  // Improved risk assessment based on multiple factors
  studentsWithAnalytics.forEach(student => {
    const avg = student.overallAverage || 0;
    const improvement = student.improvement || 0;
    const weakCount = student.weakSubjects?.length || 0;
    
    // Multi-factor risk assessment
    let riskFactors = 0;
    
    if (avg < classAverages.overall - 2) riskFactors++;
    if (improvement < -1) riskFactors++;
    if (weakCount > 2) riskFactors++;
    if (student.consistency > 0.6) riskFactors++;
    
    if (riskFactors >= 3 || avg < 4) {
      successDistribution.high++;
      student.prediction.riskLevel = 'high';
    } else if (riskFactors >= 2 || avg < 5) {
      successDistribution.medium++;
      student.prediction.riskLevel = 'medium';
    } else {
      successDistribution.low++;
      student.prediction.riskLevel = 'low';
    }
  });
  
  // Class-wide analytics
  const classAnalytics = {
    // Performance trends
    averageImprovement: students.reduce((sum, s) => sum + (s.improvement || 0), 0) / students.length,
    classAverages,
    
    // Success prediction distribution (FIXED: based on improved risk assessment)
    successDistribution,
    
    // Risk analysis (only truly at-risk students)
    atRiskStudents: studentsWithAnalytics
      .filter(s => s.prediction.riskLevel === 'high')
      .map(s => ({ 
        name: s.name, 
        studentNumber: s.studentNumber,
        overallAverage: s.overallAverage,
        riskFactors: s.prediction.recommendations 
      })),
    
    // Most improved students (FIXED: only show significant improvement)
    mostImproved: studentsWithAnalytics
      .filter(s => s.improvement > 0.5)
      .sort((a, b) => b.improvement - a.improvement)
      .slice(0, 5)
      .map(s => ({ 
        name: s.name, 
        improvement: s.improvement.toFixed(2),
        fromTo: `${s.exam1Average || 0} → ${s.exam2Average || 0}`
      })),
    
    // Subject difficulty analysis
    subjectDifficulty: calculateSubjectDifficulty(studentsWithAnalytics),
    
    // Performance patterns (FIXED: more accurate categorization)
    performancePatterns: {
      consistentlyHigh: studentsWithAnalytics.filter(s => 
        (s.exam1Average >= 8 && s.exam2Average >= 8)
      ).length,
      improving: studentsWithAnalytics.filter(s => s.improvement > 0.5).length,
      declining: studentsWithAnalytics.filter(s => s.improvement < -0.5).length,
      stable: studentsWithAnalytics.filter(s => Math.abs(s.improvement) <= 0.5).length
    }
  };
  
  return {
    students: studentsWithAnalytics,
    classAnalytics
  };
};

// Determine student learning profile
const determineLearningProfile = (student, comments, prediction) => {
  const avg = student.overallAverage || 0;
  const improvement = student.improvement || 0;
  
  let profileType = '';
  let learningStyle = '';
  let strengths = [];
  let challenges = [];
  
  // Profile type based on performance
  if (avg >= 8) {
    profileType = 'متفوق';
    if (improvement > 0) {
      learningStyle = 'مستقل - متقدم - متحسن باستمرار';
    } else {
      learningStyle = 'مستقل - متقدم - مستقر';
    }
  } else if (avg >= 6) {
    profileType = 'متوسط-جيد';
    learningStyle = 'تعاوني - يحتاج توجيه معتدل';
  } else if (avg >= 5) {
    profileType = 'متوسط';
    learningStyle = 'تعاوني - يحتاج دعم منتظم';
  } else {
    profileType = 'بحاجة لدعم';
    learningStyle = 'تعلم موجه - يحتاج متابعة مكثفة';
  }
  
  // Strengths and challenges
  if (comments.strongSubjects.length > 0) {
    strengths.push(`قوي في: ${comments.strongSubjects.slice(0, 3).join(', ')}`);
  }
  
  if (comments.weakSubjects.length > 0) {
    challenges.push(`ضعيف في: ${comments.weakSubjects.slice(0, 3).join(', ')}`);
  }
  
  if (improvement > 1) {
    strengths.push('متحسن بسرعة');
  } else if (improvement < -1) {
    challenges.push('متراجع في المستوى');
  }
  
  if (student.consistency < 0.3) {
    strengths.push('أداء مستقر بين المواد');
  } else if (student.consistency > 0.6) {
    challenges.push('تذبذب في الأداء بين المواد');
  }
  
  if (prediction.riskLevel === 'high') {
    challenges.push('مخاطر تعثر مرتفعة');
  } else if (prediction.riskLevel === 'medium') {
    challenges.push('يحتاج مراقبة');
  }
  
  return {
    type: profileType,
    learningStyle,
    strengths: strengths.length > 0 ? strengths : ['لا توجد نقاط قوة واضحة'],
    challenges: challenges.length > 0 ? challenges : ['لا توجد تحديات كبيرة'],
    riskLevel: prediction.riskLevel
  };
};

// Calculate subject difficulty based on class performance
const calculateSubjectDifficulty = (students) => {
  const subjectStats = {};
  
  students.forEach(student => {
    Object.entries(student.exam2SubjectScores || {}).forEach(([subject, score]) => {
      if (!subjectStats[subject]) {
        subjectStats[subject] = { sum: 0, count: 0, scores: [] };
      }
      subjectStats[subject].sum += score;
      subjectStats[subject].count++;
      subjectStats[subject].scores.push(score);
    });
  });
  
  return Object.entries(subjectStats)
    .map(([subject, stats]) => {
      const avg = stats.sum / stats.count;
      const stdDev = parseFloat(calculateStandardDeviation(stats.scores));
      const failureRate = ((stats.scores.filter(s => s < 5).length / stats.count) * 100);
      
      // Calculate difficulty score (0-10)
      let difficulty = 0;
      difficulty += (10 - avg) * 0.6; // Lower average = more difficult
      difficulty += (failureRate / 10) * 0.3; // Higher failure rate = more difficult
      difficulty += stdDev * 0.1; // Higher variation = more difficult
      
      return {
        subject,
        average: avg.toFixed(1),
        difficulty: Math.min(10, difficulty.toFixed(1)),
        consistency: stdDev.toFixed(2),
        failureRate: failureRate.toFixed(1)
      };
    })
    .sort((a, b) => b.difficulty - a.difficulty);
};

// Process Excel Data (Main function)
export const processExcelData = (students) => {
  return students.map(student => {
    const exam1Avg = student.exam1Average || 0;
    const exam2Avg = student.exam2Average || 0;
    const improvement = parseFloat((exam2Avg - exam1Avg).toFixed(2));
    
    // Calculate overall average (weighted: 40% exam1, 60% exam2 if both exist)
    let overallAverage;
    if (exam1Avg > 0 && exam2Avg > 0) {
      overallAverage = parseFloat(((exam1Avg * 0.4) + (exam2Avg * 0.6)).toFixed(2));
    } else {
      overallAverage = Math.max(exam1Avg, exam2Avg);
    }

    let trend = 'stable';
    if (improvement > 0.5) trend = 'improving';
    else if (improvement < -0.5) trend = 'declining';
    
    let category = 'average';
    if (overallAverage >= 8) category = 'excellent';
    else if (overallAverage >= 6) category = 'good';
    else if (overallAverage >= 5) category = 'average';
    else category = 'poor';

    return {
      ...student,
      overallAverage,
      improvement,
      trend,
      category,
      fullName: student.name 
    };
  });
};

// Legacy functions for compatibility
export const generateSmartComments = (students) => {
  return students.map(student => {
    const comments = generateAdvancedComments(student);
    const prediction = predictSuccess(student);
    
    // Generate appropriate badges
    const badges = [];
    const avg = student.overallAverage || 0;
    
    if (avg >= 9) {
      badges.push({ type: 'gold', label: 'متفوق', icon: '🏆' });
    } else if (avg >= 8) {
      badges.push({ type: 'blue', label: 'متميز', icon: '⭐' });
    } else if (avg >= 7) {
      badges.push({ type: 'green', label: 'جيد جداً', icon: '✓' });
    } else if (avg >= 6) {
      badges.push({ type: 'green', label: 'جيد', icon: '✓' });
    } else if (avg < 5) {
      badges.push({ type: 'red', label: 'دعم مطلوب', icon: '⚠️' });
    } else {
      badges.push({ type: 'orange', label: 'متوسط', icon: '↔️' });
    }
    
    if (student.improvement > 1.5) {
      badges.push({ type: 'green', label: 'تحسن كبير', icon: '📈' });
    } else if (student.improvement > 0.5) {
      badges.push({ type: 'blue', label: 'متحسن', icon: '↑' });
    } else if (student.improvement < -1) {
      badges.push({ type: 'orange', label: 'تراجع', icon: '📉' });
    }
    
    if (prediction.successProbability >= 85) {
      badges.push({ type: 'purple', label: 'مستقبل واعد', icon: '🚀' });
    } else if (prediction.successProbability < 50) {
      badges.push({ type: 'red', label: 'يحتاج دعم', icon: '🛟' });
    }
    
    return { 
      ...student, 
      comments: comments.overallComment,
      detailedComments: comments.detailedComments,
      badges,
      predictedScore: prediction.predictedScore,
      prediction: prediction
    };
  });
};

export const calculateStatistics = (students) => {
    if(!students.length) return null;
    const scores = students.map(s => s.overallAverage || 0).filter(s => s > 0);
    const avg = scores.reduce((a,b) => a+b, 0) / scores.length;
    
    const subjectStats = {};
    students.forEach(s => {
        const allSubs = { ...s.exam1SubjectScores, ...s.exam2SubjectScores };
        Object.entries(allSubs).forEach(([sub, score]) => {
            if(!subjectStats[sub]) subjectStats[sub] = { sum: 0, count: 0 };
            subjectStats[sub].sum += score;
            subjectStats[sub].count++;
        });
    });

    const subjectAverages = Object.keys(subjectStats).map(sub => ({
        name: sub,
        value: parseFloat((subjectStats[sub].sum / subjectStats[sub].count).toFixed(1))
    }));

    // Calculate realistic distribution
    const distribution = {
        excellent: students.filter(s => s.overallAverage >= 8).length,
        good: students.filter(s => s.overallAverage >= 6 && s.overallAverage < 8).length,
        average: students.filter(s => s.overallAverage >= 5 && s.overallAverage < 6).length,
        poor: students.filter(s => s.overallAverage < 5).length
    };

    return {
        average: avg.toFixed(2),
        count: students.length,
        max: Math.max(...scores).toFixed(2),
        min: Math.min(...scores).toFixed(2),
        passRate: ((scores.filter(s => s >= 5).length / scores.length) * 100).toFixed(0),
        distribution,
        subjectAverages
    };
};

// Generate comments for all students
export const generateAllStudentComments = (students) => {
  return students.map(student => {
    const comments = CommentGenerator.generateStudentComments(student);
    return {
      ...student,
      smartComments: comments
    };
  });
};

// Main processing function
export const processAllExamData = (buf1, buf2) => {
    const d1 = parseExamFile(buf1, 1);
    const d2 = parseExamFile(buf2, 2);
    const combined = combineExamData(d1, d2);
    const processed = processExcelData(combined);
    const analytics = calculateAdvancedAnalytics(processed);
    const studentsWithComments = generateAllStudentComments(processed);
    
    // Return both processed students and analytics
    return {
        students: generateSmartComments(processed),
        studentsWithComments,
        analytics: analytics?.classAnalytics || null,
        fullAnalytics: analytics
    };
};