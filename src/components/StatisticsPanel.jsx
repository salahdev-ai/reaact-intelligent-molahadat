import React from 'react';

const StatisticsPanel = ({ students, classStats, detailed = false }) => {
  // Calculate subject statistics
  const calculateSubjectStats = () => {
    const subjects = ['التعبير الكتابي', 'القراءة', 'الإملاء', 'الخط', 'الاستماع والتحدث', 'تمارين كتابية'];
    
    return subjects.map(subject => {
      const scores1 = students.map(s => s.exam1Subjects?.[subject] || 0).filter(s => s > 0);
      const scores2 = students.map(s => s.exam2Subjects?.[subject] || 0).filter(s => s > 0);
      
      const avg1 = scores1.length > 0 ? scores1.reduce((a, b) => a + b, 0) / scores1.length : 0;
      const avg2 = scores2.length > 0 ? scores2.reduce((a, b) => a + b, 0) / scores2.length : 0;
      const improvement = avg2 - avg1;
      
      // Find top and bottom performers for this subject
      const studentScores = students.map(s => ({
        name: s.name,
        score: s.exam2Subjects?.[subject] || 0
      })).filter(s => s.score > 0);
      
      studentScores.sort((a, b) => b.score - a.score);
      
      return {
        subject,
        avg1: avg1.toFixed(1),
        avg2: avg2.toFixed(1),
        improvement: improvement.toFixed(1),
        topPerformer: studentScores[0]?.name?.split(' ')[0] || '-',
        bottomPerformer: studentScores[studentScores.length - 1]?.name?.split(' ')[0] || '-',
        color: improvement > 0 ? '#48bb78' : improvement < 0 ? '#f56565' : '#a0aec0'
      };
    });
  };

  // Get top performers
  const topPerformers = [...students]
    .sort((a, b) => (b.exam2Average || 0) - (a.exam2Average || 0))
    .slice(0, 5);

  // Get most improved
  const mostImproved = [...students]
    .sort((a, b) => {
      const improvementA = (a.exam2Average || 0) - (a.exam1Average || 0);
      const improvementB = (b.exam2Average || 0) - (b.exam1Average || 0);
      return improvementB - improvementA;
    })
    .slice(0, 5);

  const subjectStats = calculateSubjectStats();
  const improvementRate = ((students.filter(s => s.improvement > 0).length / students.length) * 100).toFixed(1);

  return (
    <div className="statistics-panel">
      <div className="panel-header">
        <h2>📈 الإحصائيات والتحليلات</h2>
        {!detailed && (
          <div className="summary-stats">
            <div className="summary-stat">
              <span className="stat-label">معدل الفصل:</span>
              <span className="stat-value">{classStats.average || '0.0'}/10</span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">نسبة النجاح:</span>
              <span className="stat-value">{classStats.passRate || '0'}%</span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">معدل التحسن:</span>
              <span className="stat-value">{improvementRate}%</span>
            </div>
          </div>
        )}
      </div>

      <div className="performance-distribution">
        <h3>توزيع الطلاب حسب المستوى</h3>
        <div className="distribution-grid">
          {[
            { label: 'ممتاز (9+)', count: students.filter(s => s.exam2Average >= 9).length, color: '#48bb78' },
            { label: 'جيد جداً (8-8.9)', count: students.filter(s => s.exam2Average >= 8 && s.exam2Average < 9).length, color: '#4299e1' },
            { label: 'جيد (6-7.9)', count: students.filter(s => s.exam2Average >= 6 && s.exam2Average < 8).length, color: '#ed8936' },
            { label: 'مقبول (5-5.9)', count: students.filter(s => s.exam2Average >= 5 && s.exam2Average < 6).length, color: '#ecc94b' },
            { label: 'يحتاج متابعة (أقل من 5)', count: students.filter(s => s.exam2Average < 5).length, color: '#f56565' },
          ].map((item, index) => (
            <div key={index} className="distribution-item">
              <div className="distribution-bar">
                <div 
                  className="distribution-fill" 
                  style={{ 
                    height: `${(item.count / students.length) * 100}%`,
                    backgroundColor: item.color 
                  }}
                ></div>
              </div>
              <div className="distribution-info">
                <div className="distribution-count">{item.count}</div>
                <div className="distribution-label">{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="top-lists">
        <div className="top-list">
          <h3>🏆 الأوائل في الفصل</h3>
          <div className="list-items">
            {topPerformers.map((student, index) => (
              <div key={student.id || index} className="list-item">
                <div className="item-rank">
                  <span className={`rank-number ${index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : ''}`}>
                    {index + 1}
                  </span>
                </div>
                <div className="item-info">
                  <div className="item-name">{student.name?.split(' ')[0] || 'غير معروف'}</div>
                  <div className="item-details">
                    <span className="item-score">{student.exam2Average?.toFixed(1)}/10</span>
                    <span className={`item-improvement ${student.improvement >= 0 ? 'positive' : 'negative'}`}>
                      {student.improvement >= 0 ? '+' : ''}{student.improvement?.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="top-list">
          <h3>📈 الأكثر تحسناً</h3>
          <div className="list-items">
            {mostImproved.map((student, index) => (
              <div key={student.id || index} className="list-item">
                <div className="item-rank">
                  <span className="improvement-icon">🚀</span>
                </div>
                <div className="item-info">
                  <div className="item-name">{student.name?.split(' ')[0] || 'غير معروف'}</div>
                  <div className="item-details">
                    <span className="progress-bar">
                      <span className="progress-from">{student.exam1Average?.toFixed(1)}</span>
                      <span className="progress-arrow">→</span>
                      <span className="progress-to">{student.exam2Average?.toFixed(1)}</span>
                    </span>
                    <span className="item-improvement positive">+{student.improvement?.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="subject-statistics">
        <h3>📊 أداء المواد الدراسية</h3>
        <div className="subject-table">
          <div className="table-header">
            <div className="header-cell">المادة</div>
            <div className="header-cell">معدل الفرض 1</div>
            <div className="header-cell">معدل الفرض 2</div>
            <div className="header-cell">التحسن</div>
            <div className="header-cell">الأوائل</div>
          </div>
          {subjectStats.map((subject, index) => (
            <div key={index} className="table-row">
              <div className="table-cell subject-name">{subject.subject}</div>
              <div className="table-cell">
                <span className="score-badge">{subject.avg1}</span>
              </div>
              <div className="table-cell">
                <span className="score-badge current">{subject.avg2}</span>
              </div>
              <div className="table-cell">
                <span className={`improvement-badge ${subject.improvement > 0 ? 'positive' : subject.improvement < 0 ? 'negative' : 'neutral'}`}>
                  {subject.improvement > 0 ? '+' : ''}{subject.improvement}
                </span>
              </div>
              <div className="table-cell top-student">{subject.topPerformer}</div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .statistics-panel {
          background: white;
          border-radius: 15px;
          padding: 25px;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
        }

        .panel-header {
          margin-bottom: 30px;
          border-bottom: 2px solid #f7fafc;
          padding-bottom: 20px;
        }

        .panel-header h2 {
          margin: 0 0 15px 0;
          color: #2d3748;
          font-size: 1.8rem;
        }

        .summary-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .summary-stat {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 10px;
        }

        .stat-label {
          color: #718096;
          font-size: 0.95rem;
        }

        .stat-value {
          font-weight: 700;
          color: #2d3748;
          font-size: 1.2rem;
        }

        .performance-distribution {
          margin-bottom: 30px;
        }

        .performance-distribution h3 {
          margin: 0 0 20px 0;
          color: #2d3748;
          font-size: 1.3rem;
        }

        .distribution-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 20px;
        }

        .distribution-item {
          text-align: center;
        }

        .distribution-bar {
          height: 120px;
          background: #f7fafc;
          border-radius: 8px;
          position: relative;
          overflow: hidden;
          margin-bottom: 10px;
        }

        .distribution-fill {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          border-radius: 8px;
          transition: height 0.5s ease-in-out;
        }

        .distribution-info {
          text-align: center;
        }

        .distribution-count {
          font-size: 1.8rem;
          font-weight: 700;
          color: #2d3748;
          margin-bottom: 5px;
        }

        .distribution-label {
          color: #718096;
          font-size: 0.85rem;
          line-height: 1.3;
        }

        .top-lists {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 25px;
          margin-bottom: 30px;
        }

        .top-list h3 {
          margin: 0 0 15px 0;
          color: #2d3748;
          font-size: 1.2rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .list-items {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 15px;
        }

        .list-item {
          display: flex;
          align-items: center;
          padding: 12px;
          background: white;
          border-radius: 8px;
          margin-bottom: 10px;
          transition: transform 0.3s;
        }

        .list-item:hover {
          transform: translateX(5px);
        }

        .list-item:last-child {
          margin-bottom: 0;
        }

        .item-rank {
          margin-left: 15px;
        }

        .rank-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 35px;
          height: 35px;
          border-radius: 8px;
          font-weight: 700;
          color: white;
          background: #a0aec0;
        }

        .rank-number.gold {
          background: linear-gradient(135deg, #f6e05e, #d69e2e);
        }

        .rank-number.silver {
          background: linear-gradient(135deg, #cbd5e0, #a0aec0);
        }

        .rank-number.bronze {
          background: linear-gradient(135deg, #ed8936, #c05621);
        }

        .improvement-icon {
          font-size: 24px;
        }

        .item-info {
          flex: 1;
        }

        .item-name {
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 5px;
        }

        .item-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .item-score {
          font-weight: 700;
          color: #2d3748;
          font-size: 1.1rem;
        }

        .item-improvement {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .item-improvement.positive {
          background: #c6f6d5;
          color: #22543d;
        }

        .item-improvement.negative {
          background: #fed7d7;
          color: #742a2a;
        }

        .progress-bar {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .progress-from {
          color: #718096;
          font-size: 0.9rem;
        }

        .progress-arrow {
          color: #a0aec0;
        }

        .progress-to {
          color: #2d3748;
          font-weight: 600;
        }

        .subject-statistics {
          margin-top: 30px;
        }

        .subject-statistics h3 {
          margin: 0 0 20px 0;
          color: #2d3748;
          font-size: 1.3rem;
        }

        .subject-table {
          background: #f8f9fa;
          border-radius: 12px;
          overflow: hidden;
        }

        .table-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
          background: #667eea;
          color: white;
          font-weight: 600;
          padding: 15px 20px;
          font-size: 0.95rem;
        }

        .header-cell {
          text-align: center;
        }

        .table-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
          padding: 12px 20px;
          border-bottom: 1px solid #e2e8f0;
          background: white;
          transition: background 0.3s;
        }

        .table-row:hover {
          background: #f7fafc;
        }

        .table-row:last-child {
          border-bottom: none;
        }

        .table-cell {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
        }

        .subject-name {
          justify-content: flex-start;
          font-weight: 500;
          color: #2d3748;
        }

        .score-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 50px;
          padding: 6px 12px;
          background: #e2e8f0;
          border-radius: 20px;
          font-weight: 600;
          color: #4a5568;
        }

        .score-badge.current {
          background: #c6f6d5;
          color: #22543d;
        }

        .improvement-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 50px;
          padding: 6px 12px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .improvement-badge.positive {
          background: #c6f6d5;
          color: #22543d;
        }

        .improvement-badge.negative {
          background: #fed7d7;
          color: #742a2a;
        }

        .improvement-badge.neutral {
          background: #e2e8f0;
          color: #4a5568;
        }

        .top-student {
          font-weight: 500;
          color: #2d3748;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
};

export default StatisticsPanel;