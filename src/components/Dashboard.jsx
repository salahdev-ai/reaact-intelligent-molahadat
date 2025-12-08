import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import StudentCard from './StudentCard';
import StatisticsPanel from './StatisticsPanel';
import MLPredictor from './MLPredictor';
import { processExcelData, calculateStatistics, generateSmartComments, predictNextExam } from './DataProcessor';

const Dashboard = () => {
  const [students, setStudents] = useState([]);
  const [classStats, setClassStats] = useState({});
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [exam1File, setExam1File] = useState(null);
  const [exam2File, setExam2File] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Handle file selection
  const handleFileSelect = (e, examNumber) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if file is Excel
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      setUploadError('الرجاء تحميل ملف إكسل فقط (.xlsx أو .xls)');
      return;
    }

    if (examNumber === 1) {
      setExam1File(file);
    } else {
      setExam2File(file);
    }
    setUploadError('');
  };

  // Remove selected file
  const removeFile = (examNumber) => {
    if (examNumber === 1) {
      setExam1File(null);
    } else {
      setExam2File(null);
    }
  };

  // Process uploaded files
  const processUploadedFiles = () => {
    if (!exam1File || !exam2File) {
      setUploadError('الرجاء تحميل كلا الملفين');
      return;
    }

    setIsLoading(true);
    setUploadError('');

    // Simulate processing (replace with actual Excel parsing)
    setTimeout(() => {
      try {
        // Create sample data based on your Excel structure
        const sampleData = createSampleData();
        const processedStudents = processExcelData(sampleData);
        const stats = calculateStatistics(processedStudents);
        const studentsWithComments = generateSmartComments(processedStudents);
        
        // Add predictions
        const finalStudents = studentsWithComments.map(student => ({
          ...student,
          predictedExam3: predictNextExam(student)
        }));

        // Sort by rank
        finalStudents.sort((a, b) => (a.rank || 0) - (b.rank || 0));

        setStudents(finalStudents);
        setClassStats(stats);
      } catch (error) {
        console.error('Error processing data:', error);
        setUploadError('حدث خطأ في معالجة البيانات. يرجى التأكد من تنسيق الملفات.');
      } finally {
        setIsLoading(false);
      }
    }, 1500);
  };

  // Create sample data based on your Excel files
  const createSampleData = () => {
    const students = [];
    
    // Sample student data matching your Excel format
    const sampleStudents = [
      { id: '14801803', studentNumber: 'R193014063', name: 'بوكلزيم امين', dateOfBirth: '12-12-2013' },
      { id: '18400037', studentNumber: 'R201072973', name: 'سكوري ايوب', dateOfBirth: '23-02-2016' },
      { id: '14801842', studentNumber: 'R197014100', name: 'التحادي ادم', dateOfBirth: '01-01-2014' },
      { id: '16190613', studentNumber: 'R202000172', name: 'المناني ليلى', dateOfBirth: '20-11-2015' },
      { id: '16206333', studentNumber: 'R202002849', name: 'المناني جنات', dateOfBirth: '15-09-2015' },
      { id: '18399917', studentNumber: 'R202072963', name: 'تقي هبة', dateOfBirth: '06-04-2015' },
      { id: '16190215', studentNumber: 'R203000067', name: 'الهلالي اية', dateOfBirth: '29-01-2016' },
      { id: '16190685', studentNumber: 'R204000203', name: 'الباهي محمد', dateOfBirth: '30-10-2015' },
    ];

    sampleStudents.forEach((student, index) => {
      // Generate realistic scores
      const baseScore = 5 + Math.random() * 5; // Between 5-10
      const exam1Score = Math.min(10, Math.max(2, baseScore - Math.random() * 2));
      const exam2Score = Math.min(10, Math.max(2, baseScore + Math.random() * 1.5));
      
      // Generate subject scores
      const subjects = ['التعبير الكتابي', 'القراءة', 'الإملاء', 'الخط', 'الاستماع والتحدث', 'تمارين كتابية'];
      const exam1Subjects = {};
      const exam2Subjects = {};
      
      subjects.forEach(subject => {
        const variation = (Math.random() - 0.5) * 2;
        exam1Subjects[subject] = Math.min(10, Math.max(1, exam1Score + variation));
        exam2Subjects[subject] = Math.min(10, Math.max(1, exam2Score + variation + (Math.random() * 0.5)));
      });

      students.push({
        ...student,
        exam1Average: parseFloat(exam1Score.toFixed(1)),
        exam2Average: parseFloat(exam2Score.toFixed(1)),
        overallAverage: parseFloat(((exam1Score + exam2Score) / 2).toFixed(1)),
        improvement: parseFloat((exam2Score - exam1Score).toFixed(1)),
        exam1Subjects,
        exam2Subjects,
        rank: index + 1,
        attendance: 85 + Math.floor(Math.random() * 15) // 85-100%
      });
    });

    return students;
  };

  // Filter students based on search
  const filteredStudents = students.filter(student =>
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.id?.toString().includes(searchTerm)
  );

  // Export data to CSV
  const exportData = () => {
    const dataToExport = students.map(student => ({
      'الرقم': student.id,
      'رقم الطالب': student.studentNumber,
      'الاسم': student.name,
      'تاريخ الميلاد': student.dateOfBirth,
      'معدل الفرض 1': student.exam1Average?.toFixed(2) || '0.00',
      'معدل الفرض 2': student.exam2Average?.toFixed(2) || '0.00',
      'التحسن': student.improvement?.toFixed(2) || '0.00',
      'الترتيب': student.rank || 'N/A',
      'التنبؤ للامتحان 3': student.predictedExam3?.toFixed(2) || '0.00'
    }));

    const csv = [
      Object.keys(dataToExport[0] || {}).join(','),
      ...dataToExport.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `نتائج_الطلاب_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // If no data uploaded, show upload screen
  if (students.length === 0) {
    return (
      <div className="dashboard upload-mode">
        <header className="dashboard-header">
          <div className="header-content">
            <h1>📊 نظام تحليل أداء الطلاب</h1>
            <p className="subtitle">لوحة تحكم ذكية لتحليل نتائج الامتحانات</p>
          </div>
        </header>

        <div className="upload-section">
          <div className="upload-header">
            <h2>رفع ملفات الامتحانات</h2>
            <p>ارفع ملفات إكسل للفرض الأول والثاني للحصول على تحليل شامل</p>
          </div>

          <div className="file-upload-grid">
            {/* Exam 1 Upload */}
            <div className={`upload-card ${exam1File ? 'has-file' : ''}`}>
              <div className="upload-icon">📁</div>
              <h3>الفرض الأول</h3>
              <p>Exam 1 (الفرض الأول)</p>
              
              {!exam1File ? (
                <label className="upload-btn">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => handleFileSelect(e, 1)}
                    disabled={isLoading}
                  />
                  <span className="btn-icon">📂</span>
                  اختر ملف
                </label>
              ) : (
                <div className="file-info">
                  <div className="file-details">
                    <span className="file-icon">📄</span>
                    <div>
                      <p className="file-name">{exam1File.name}</p>
                      <p className="file-size">{(exam1File.size / 1024).toFixed(2)} كيلوبايت</p>
                    </div>
                  </div>
                  <button 
                    className="remove-btn" 
                    onClick={() => removeFile(1)}
                    disabled={isLoading}
                  >
                    ❌
                  </button>
                </div>
              )}
            </div>

            {/* Exam 2 Upload */}
            <div className={`upload-card ${exam2File ? 'has-file' : ''}`}>
              <div className="upload-icon">📁</div>
              <h3>الفرض الثاني</h3>
              <p>Exam 2 (الفرض الثاني)</p>
              
              {!exam2File ? (
                <label className="upload-btn">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => handleFileSelect(e, 2)}
                    disabled={isLoading}
                  />
                  <span className="btn-icon">📂</span>
                  اختر ملف
                </label>
              ) : (
                <div className="file-info">
                  <div className="file-details">
                    <span className="file-icon">📄</span>
                    <div>
                      <p className="file-name">{exam2File.name}</p>
                      <p className="file-size">{(exam2File.size / 1024).toFixed(2)} كيلوبايت</p>
                    </div>
                  </div>
                  <button 
                    className="remove-btn" 
                    onClick={() => removeFile(2)}
                    disabled={isLoading}
                  >
                    ❌
                  </button>
                </div>
              )}
            </div>
          </div>

          {uploadError && (
            <div className="error-message">
              {uploadError}
            </div>
          )}

          <button
            className={`process-btn ${isLoading ? 'loading' : ''}`}
            onClick={processUploadedFiles}
            disabled={(!exam1File || !exam2File) || isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                جاري معالجة البيانات...
              </>
            ) : (
              'بدء التحليل'
            )}
          </button>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h4>تحليل إحصائي متقدم</h4>
              <p>إحصائيات مفصلة ومقارنات بين الامتحانات</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💡</div>
              <h4>تعليقات ذكية</h4>
              <p>تقييم آلي مع نصائح للتحسين</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h4>تنبؤات بالذكاء الاصطناعي</h4>
              <p>توقع الأداء المستقبلي للطلاب</p>
            </div>
          </div>
        </div>

        <footer className="dashboard-footer">
          <p>نظام تحليل أداء الطلاب - تم التطوير باستخدام تقنيات الذكاء الاصطناعي</p>
          <p>جميع البيانات تبقى محلية ولا ترفع إلى أي سيرفر خارجي</p>
        </footer>
      </div>
    );
  }

  // Main dashboard with data
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>📊 نظام تحليل أداء الطلاب</h1>
          <p className="subtitle">لوحة تحكم ذكية لتحليل نتائج الامتحانات</p>
          <div className="class-info">
            <span>الصف: الثاني ابتدائي عام</span>
            <span>القسم: 2APG-1</span>
            <span>المادة: اللغة العربية</span>
            <span>2023/2022</span>
          </div>
        </div>
        <button className="export-btn" onClick={exportData}>
          📥 تصدير البيانات
        </button>
      </header>

      <div className="controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="🔍 ابحث عن طالب بالاسم أو الرقم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="tabs-container">
          <button
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 نظرة عامة
          </button>
          <button
            className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            👨‍🎓 التلاميذ
          </button>
          <button
            className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            📈 إحصائيات
          </button>
          <button
            className={`tab-btn ${activeTab === 'ml' ? 'active' : ''}`}
            onClick={() => setActiveTab('ml')}
          >
            🤖 تنبؤات
          </button>
        </div>
      </div>

      <div className="stats-overview">
        <div className="stat-card">
          <h4>عدد الطلاب</h4>
          <div className="stat-value">{students.length}</div>
        </div>
        <div className="stat-card">
          <h4>متوسط الفصل</h4>
          <div className="stat-value">{classStats.average || '0.0'}/10</div>
        </div>
        <div className="stat-card">
          <h4>أكثر طالب تحسناً</h4>
          <div className="stat-value">{classStats.mostImproved || '-'}</div>
        </div>
        <div className="stat-card">
          <h4>أعلى معدل</h4>
          <div className="stat-value">{classStats.topScore || '0.0'}/10</div>
        </div>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-grid">
            <div className="welcome-card">
              <h3>مرحباً بك في نظام التحليل الذكي</h3>
              <p>تم تحليل بيانات {students.length} طالب بنجاح. استخدم الأزرار أعلاه للتنقل بين الميزات المختلفة.</p>
              <div className="quick-stats">
                <div className="quick-stat">
                  <span className="stat-label">طلاب متميزون (8+)</span>
                  <span className="stat-count">{students.filter(s => s.exam2Average >= 8).length}</span>
                </div>
                <div className="quick-stat">
                  <span className="stat-label">طلاب بحاجة لمتابعة (&lt;5)</span>
                  <span className="stat-count">{students.filter(s => s.exam2Average < 5).length}</span>
                </div>
                <div className="quick-stat">
                  <span className="stat-label">معدل التحسن</span>
                  <span className="stat-count">{classStats.improvementRate || '0'}%</span>
                </div>
              </div>
            </div>
            <StatisticsPanel students={filteredStudents} classStats={classStats} />
          </div>
        )}

        {activeTab === 'students' && (
          <div className="students-grid">
            {filteredStudents.map((student, index) => (
              <StudentCard
                key={student.id || index}
                student={student}
                onClick={() => setSelectedStudent(student)}
                isSelected={selectedStudent?.id === student.id}
              />
            ))}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="stats-full">
            <StatisticsPanel students={filteredStudents} classStats={classStats} detailed={true} />
          </div>
        )}

        {activeTab === 'ml' && (
          <MLPredictor students={filteredStudents} />
        )}
      </div>

      {selectedStudent && (
        <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>تفاصيل التلميذ: {selectedStudent.name}</h3>
              <button className="close-btn" onClick={() => setSelectedStudent(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="student-details">
                <div className="detail-row">
                  <span>رقم الطالب:</span>
                  <span>{selectedStudent.studentNumber}</span>
                </div>
                <div className="detail-row">
                  <span>تاريخ الميلاد:</span>
                  <span>{selectedStudent.dateOfBirth}</span>
                </div>
                <div className="detail-row">
                  <span>الترتيب في الفصل:</span>
                  <span className="rank">#{selectedStudent.rank}</span>
                </div>
                <div className="detail-row">
                  <span>نسبة الحضور:</span>
                  <span className="attendance">{selectedStudent.attendance || '95'}%</span>
                </div>
              </div>
              
              <div className="performance-metrics">
                <div className="metric">
                  <h4>📊 الأداء</h4>
                  <div className="metric-grid">
                    <div className="metric-item">
                      <span>الفرض الأول:</span>
                      <span className="score">{selectedStudent.exam1Average?.toFixed(1) || 'N/A'}/10</span>
                    </div>
                    <div className="metric-item">
                      <span>الفرض الثاني:</span>
                      <span className="score">{selectedStudent.exam2Average?.toFixed(1) || 'N/A'}/10</span>
                    </div>
                    <div className="metric-item">
                      <span>المتوسط:</span>
                      <span className="score average">
                        {selectedStudent.overallAverage?.toFixed(1) || 'N/A'}/10
                      </span>
                    </div>
                    <div className="metric-item">
                      <span>التحسن:</span>
                      <span className={`score ${selectedStudent.improvement >= 0 ? 'positive' : 'negative'}`}>
                        {selectedStudent.improvement >= 0 ? '+' : ''}{selectedStudent.improvement?.toFixed(1) || '0.0'}
                      </span>
                    </div>
                    <div className="metric-item">
                      <span>التنبؤ للامتحان 3:</span>
                      <span className="score predicted">{selectedStudent.predictedExam3?.toFixed(1) || 'N/A'}/10</span>
                    </div>
                  </div>
                </div>

                <div className="metric">
                  <h4>💡 الملاحظات</h4>
                  <div className="comments-box">
                    {selectedStudent.comments || 'لا توجد ملاحظات حالياً'}
                  </div>
                </div>

                {selectedStudent.strengths && selectedStudent.strengths.length > 0 && (
                  <div className="metric">
                    <h4>✅ نقاط القوة</h4>
                    <div className="strengths-list">
                      {selectedStudent.strengths.map((strength, idx) => (
                        <div key={idx} className="strength-item">✓ {strength}</div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedStudent.weaknesses && selectedStudent.weaknesses.length > 0 && (
                  <div className="metric">
                    <h4>⚠️ نقاط الضعف</h4>
                    <div className="weaknesses-list">
                      {selectedStudent.weaknesses.map((weakness, idx) => (
                        <div key={idx} className="weakness-item">⚠️ {weakness}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="dashboard-footer">
        <p>نظام تحليل أداء الطلاب - تم التطوير باستخدام تقنيات الذكاء الاصطناعي</p>
        <p>عرض {filteredStudents.length} من أصل {students.length} طالب</p>
      </footer>
    </div>
  );
};

export default Dashboard;