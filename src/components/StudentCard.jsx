import React from 'react';

const StudentCard = ({ student, onClick, isSelected }) => {
  const exam1Avg = student.exam1Average || 0;
  const exam2Avg = student.exam2Average || 0;
  const improvement = exam2Avg - exam1Avg;
  
  const getPerformanceLevel = (average) => {
    if (average >= 9) return { label: 'ممتاز', color: '#48bb78', bgColor: '#f0fff4' };
    if (average >= 8) return { label: 'جيد جداً', color: '#4299e1', bgColor: '#ebf8ff' };
    if (average >= 6) return { label: 'جيد', color: '#ed8936', bgColor: '#fffaf0' };
    if (average >= 5) return { label: 'مقبول', color: '#ecc94b', bgColor: '#fffff0' };
    return { label: 'يحتاج متابعة', color: '#f56565', bgColor: '#fff5f5' };
  };

  const performance = getPerformanceLevel(exam2Avg);
  const trendIcon = improvement > 0.5 ? '📈' : improvement < -0.5 ? '📉' : '➡️';

  return (
    <div 
      className={`student-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      style={{ borderColor: isSelected ? performance.color : 'transparent' }}
    >
      <div className="student-header">
        <div className="student-avatar" style={{ background: `linear-gradient(135deg, ${performance.color} 0%, #ffffff 100%)` }}>
          {student.name?.charAt(0) || 'ط'}
        </div>
        <div className="student-info">
          <h3 className="student-name">{student.name || 'غير معروف'}</h3>
          <div className="student-meta">
            <span className="student-id">#{student.studentNumber || student.id}</span>
            <span className="student-rank">الترتيب: {student.rank || 'N/A'}</span>
          </div>
        </div>
        <div className="performance-badge" style={{ backgroundColor: performance.color, color: 'white' }}>
          {performance.label}
        </div>
      </div>

      <div className="student-performance">
        <div className="exam-scores">
          <div className="exam-score">
            <div className="score-header">
              <span className="score-label">الفرض الأول</span>
              <span className="score-trend">
                {trendIcon} {improvement > 0 ? '+' : ''}{improvement.toFixed(1)}
              </span>
            </div>
            <div className="score-bar">
              <div 
                className="score-fill exam1" 
                style={{ width: `${(exam1Avg / 10) * 100}%` }}
              ></div>
              <span className="score-value">{exam1Avg.toFixed(1)}</span>
            </div>
          </div>
          
          <div className="exam-score">
            <div className="score-header">
              <span className="score-label">الفرض الثاني</span>
              <span className="score-value-display">{exam2Avg.toFixed(1)}/10</span>
            </div>
            <div className="score-bar">
              <div 
                className="score-fill exam2" 
                style={{ width: `${(exam2Avg / 10) * 100}%` }}
              ></div>
              <span className="score-value">{exam2Avg.toFixed(1)}</span>
            </div>
          </div>
        </div>

        <div className="improvement-indicator">
          <div className="improvement-label">مستوى التحسن:</div>
          <div className={`improvement-value ${improvement > 1 ? 'high' : improvement > 0 ? 'medium' : 'low'}`}>
            {improvement > 0 ? 'مرتفع' : improvement === 0 ? 'مستقر' : 'منخفض'}
          </div>
        </div>

        <div className="subject-previews">
          {student.exam2Subjects && Object.entries(student.exam2Subjects).slice(0, 3).map(([subject, score], idx) => (
            <div key={idx} className="subject-preview">
              <span className="subject-name">{subject}</span>
              <div className="subject-score">
                <div 
                  className="subject-progress" 
                  style={{ width: `${(score / 10) * 100}%`, backgroundColor: performance.color }}
                ></div>
                <span className="subject-value">{score.toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>

        {student.predictedExam3 && (
          <div className="prediction-card">
            <div className="prediction-header">
              <span className="prediction-icon">🔮</span>
              <span className="prediction-label">التنبؤ للامتحان 3</span>
            </div>
            <div className="prediction-value">{student.predictedExam3.toFixed(1)}/10</div>
            <div className="prediction-confidence">
              <span className="confidence-label">ثقة:</span>
              <span className="confidence-value">{(70 + Math.random() * 25).toFixed(0)}%</span>
            </div>
          </div>
        )}
      </div>

      <div className="student-footer">
        <div className="attendance-info">
          <span className="attendance-icon">📅</span>
          <span className="attendance-text">الحضور: {student.attendance || 95}%</span>
        </div>
        <button className="details-btn" onClick={(e) => { e.stopPropagation(); onClick(); }}>
          عرض التفاصيل
        </button>
      </div>

      <style jsx>{`
        .student-card {
          background: white;
          border-radius: 15px;
          padding: 20px;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
          cursor: pointer;
          transition: all 0.3s;
          border: 2px solid transparent;
        }

        .student-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
        }

        .student-card.selected {
          border-color: #667eea;
          background: linear-gradient(135deg, #f8f9ff 0%, #fff 100%);
        }

        .student-header {
          display: flex;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .student-avatar {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
          font-weight: 700;
          margin-left: 15px;
        }

        .student-info {
          flex: 1;
        }

        .student-name {
          margin: 0 0 8px 0;
          color: #2d3748;
          font-size: 1.3rem;
          font-weight: 600;
          line-height: 1.3;
        }

        .student-meta {
          display: flex;
          gap: 10px;
        }

        .student-id, .student-rank {
          font-size: 0.85rem;
          color: #718096;
          background: #f7fafc;
          padding: 4px 10px;
          border-radius: 6px;
        }

        .performance-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .student-performance {
          margin-bottom: 20px;
        }

        .exam-scores {
          display: grid;
          gap: 15px;
          margin-bottom: 20px;
        }

        .exam-score {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 10px;
        }

        .score-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .score-label {
          color: #718096;
          font-size: 0.95rem;
          font-weight: 500;
        }

        .score-trend {
          color: ${improvement > 0 ? '#48bb78' : improvement < 0 ? '#f56565' : '#a0aec0'};
          font-weight: 600;
          font-size: 0.9rem;
        }

        .score-bar {
          height: 30px;
          background: #e2e8f0;
          border-radius: 15px;
          position: relative;
          overflow: hidden;
        }

        .score-fill {
          height: 100%;
          position: absolute;
          top: 0;
          right: 0;
          border-radius: 15px;
          transition: width 0.5s ease-in-out;
        }

        .score-fill.exam1 {
          background: linear-gradient(90deg, #4299e1, #63b3ed);
        }

        .score-fill.exam2 {
          background: linear-gradient(90deg, #48bb78, #68d391);
        }

        .score-value {
          position: absolute;
          right: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: white;
          font-weight: 600;
          font-size: 0.9rem;
          z-index: 2;
        }

        .score-value-display {
          font-weight: 700;
          color: #2d3748;
          font-size: 1.1rem;
        }

        .improvement-indicator {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding: 12px 15px;
          background: #f8f9fa;
          border-radius: 10px;
        }

        .improvement-label {
          color: #718096;
          font-size: 0.95rem;
        }

        .improvement-value {
          padding: 6px 12px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .improvement-value.high {
          background: #c6f6d5;
          color: #22543d;
        }

        .improvement-value.medium {
          background: #feebc8;
          color: #744210;
        }

        .improvement-value.low {
          background: #fed7d7;
          color: #742a2a;
        }

        .subject-previews {
          display: grid;
          gap: 10px;
          margin-bottom: 20px;
        }

        .subject-preview {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #e2e8f0;
        }

        .subject-preview:last-child {
          border-bottom: none;
        }

        .subject-name {
          color: #718096;
          font-size: 0.9rem;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .subject-score {
          width: 100px;
          height: 20px;
          background: #e2e8f0;
          border-radius: 10px;
          position: relative;
          overflow: hidden;
        }

        .subject-progress {
          height: 100%;
          position: absolute;
          top: 0;
          right: 0;
          border-radius: 10px;
        }

        .subject-value {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          z-index: 2;
        }

        .prediction-card {
          background: linear-gradient(135deg, #f8f4ff 0%, #f0ebfa 100%);
          border-radius: 10px;
          padding: 15px;
          border: 1px solid #e9d8fd;
          margin-bottom: 15px;
        }

        .prediction-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }

        .prediction-icon {
          font-size: 18px;
        }

        .prediction-label {
          color: #6b46c1;
          font-weight: 600;
          font-size: 0.95rem;
        }

        .prediction-value {
          font-size: 1.8rem;
          font-weight: 700;
          color: #6b46c1;
          text-align: center;
          margin-bottom: 10px;
        }

        .prediction-confidence {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
        }

        .confidence-label {
          color: #718096;
        }

        .confidence-value {
          color: #6b46c1;
          font-weight: 600;
        }

        .student-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 15px;
          border-top: 1px solid #e2e8f0;
        }

        .attendance-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .attendance-icon {
          font-size: 16px;
        }

        .attendance-text {
          color: #718096;
          font-size: 0.9rem;
        }

        .details-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          font-size: 0.9rem;
          transition: all 0.3s;
        }

        .details-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }
      `}</style>
    </div>
  );
};

export default StudentCard;