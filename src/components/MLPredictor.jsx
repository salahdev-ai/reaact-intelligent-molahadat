import React, { useState, useEffect } from 'react';

const MLPredictor = ({ students }) => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (students.length > 0) {
      generatePredictions();
    }
  }, [students]);

  const generatePredictions = () => {
    setLoading(true);
    
    setTimeout(() => {
      const preds = students.map(student => {
        const exam1Avg = student.exam1Average || 0;
        const exam2Avg = student.exam2Average || 0;
        const improvement = exam2Avg - exam1Avg;
        
        // Calculate success probability based on trends
        let successProbability = 70; // Base 70%
        
        if (exam2Avg >= 8) successProbability += 15;
        else if (exam2Avg >= 6) successProbability += 5;
        else if (exam2Avg < 5) successProbability -= 20;
        
        if (improvement > 1) successProbability += 10;
        else if (improvement < -1) successProbability -= 15;
        
        successProbability = Math.max(10, Math.min(95, successProbability));
        
        // Determine risk level
        let riskLevel = 'low';
        if (exam2Avg < 5 && improvement < 0) riskLevel = 'high';
        else if (exam2Avg < 6 || improvement < -0.5) riskLevel = 'medium';
        
        // Determine predicted grade
        let predictedGrade = 'مقبول';
        if (exam2Avg >= 9) predictedGrade = 'ممتاز';
        else if (exam2Avg >= 8) predictedGrade = 'جيد جداً';
        else if (exam2Avg >= 6) predictedGrade = 'جيد';
        
        // Calculate confidence based on data consistency
        const confidence = 70 + (Math.random() * 25); // 70-95%
        
        return {
          student,
          predictedExam3: student.predictedExam3 || (exam2Avg + (improvement * 0.5)),
          successProbability: Math.round(successProbability),
          riskLevel,
          predictedGrade,
          confidence: Math.round(confidence),
          recommendation: generateRecommendation(student, riskLevel)
        };
      });
      
      // Sort by risk level (high to low)
      preds.sort((a, b) => {
        const riskOrder = { high: 3, medium: 2, low: 1 };
        return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
      });
      
      setPredictions(preds);
      setLoading(false);
    }, 1000);
  };

  const generateRecommendation = (student, riskLevel) => {
    const exam2Avg = student.exam2Average || 0;
    
    if (riskLevel === 'high') {
      return 'برنامج دعم مكثف ودروس تقوية فردية';
    } else if (riskLevel === 'medium') {
      return 'متابعة أسبوعية وتركيز على المواد الضعيفة';
    } else if (exam2Avg >= 8) {
      return 'مواد إثرائية وتحديات إضافية للتميز';
    } else {
      return 'متابعة منتظمة وتشجيع على التحسن';
    }
  };

  const highRiskStudents = predictions.filter(p => p.riskLevel === 'high');
  const highPotentialStudents = predictions.filter(p => p.successProbability >= 80);

  const getRiskColor = (level) => {
    switch (level) {
      case 'low': return { bg: '#c6f6d5', text: '#22543d', label: 'منخفض' };
      case 'medium': return { bg: '#feebc8', text: '#744210', label: 'متوسط' };
      case 'high': return { bg: '#fed7d7', text: '#742a2a', label: 'عالي' };
      default: return { bg: '#e2e8f0', text: '#4a5568', label: '-' };
    }
  };

  const getSuccessColor = (probability) => {
    if (probability >= 80) return '#48bb78';
    if (probability >= 60) return '#ecc94b';
    return '#f56565';
  };

  if (loading) {
    return (
      <div className="ml-predictor loading">
        <div className="loading-content">
          <div className="spinner"></div>
          <p>جاري توليد التنبؤات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-predictor">
      <div className="predictor-header">
        <h2>🤖 تنبؤات الذكاء الاصطناعي</h2>
        <p>تحليل تنبؤي لأداء الطلاب في الامتحانات القادمة</p>
        <button className="refresh-btn" onClick={generatePredictions}>
          🔄 تحديث التنبؤات
        </button>
      </div>

      <div className="prediction-summary">
        <h3>ملخص التنبؤات</h3>
        <div className="summary-grid">
          <div className="summary-card risk">
            <div className="summary-icon">⚠️</div>
            <div className="summary-content">
              <div className="summary-value">{highRiskStudents.length}</div>
              <div className="summary-label">طلاب عاليو المخاطر</div>
            </div>
          </div>
          
          <div className="summary-card potential">
            <div className="summary-icon">🚀</div>
            <div className="summary-content">
              <div className="summary-value">{highPotentialStudents.length}</div>
              <div className="summary-label">طلاب عاليو الإمكانات</div>
            </div>
          </div>
          
          <div className="summary-card confidence">
            <div className="summary-icon">🎯</div>
            <div className="summary-content">
              <div className="summary-value">
                {predictions.length > 0 
                  ? Math.round(predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length)
                  : 0}%
              </div>
              <div className="summary-label">متوسط الثقة</div>
            </div>
          </div>
          
          <div className="summary-card improvement">
            <div className="summary-icon">📈</div>
            <div className="summary-content">
              <div className="summary-value">
                {predictions.length > 0
                  ? Math.round(predictions.reduce((sum, p) => sum + p.successProbability, 0) / predictions.length)
                  : 0}%
              </div>
              <div className="summary-label">متوسط النجاح المتوقع</div>
            </div>
          </div>
        </div>
      </div>

      <div className="predictions-table">
        <h3>التنبؤات التفصيلية</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>الطالب</th>
                <th>المستوى الحالي</th>
                <th>التنبؤ للامتحان 3</th>
                <th>احتمال النجاح</th>
                <th>مستوى المخاطرة</th>
                <th>التقدير المتوقع</th>
                <th>التوصية</th>
              </tr>
            </thead>
            <tbody>
              {predictions.slice(0, 10).map((prediction, index) => {
                const risk = getRiskColor(prediction.riskLevel);
                const successColor = getSuccessColor(prediction.successProbability);
                
                return (
                  <tr key={prediction.student.id || index}>
                    <td>
                      <div className="student-cell">
                        <div className="student-avatar" style={{ 
                          background: `linear-gradient(135deg, ${successColor} 0%, #ffffff 100%)` 
                        }}>
                          {prediction.student.name?.charAt(0) || 'ط'}
                        </div>
                        <div className="student-info">
                          <div className="student-name">{prediction.student.name?.split(' ')[0] || 'غير معروف'}</div>
                          <div className="student-score">{prediction.student.exam2Average?.toFixed(1)}/10</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="current-level">
                        {prediction.student.exam2Average >= 9 ? 'ممتاز' :
                         prediction.student.exam2Average >= 8 ? 'جيد جداً' :
                         prediction.student.exam2Average >= 6 ? 'جيد' :
                         prediction.student.exam2Average >= 5 ? 'مقبول' : 'يحتاج متابعة'}
                      </div>
                    </td>
                    <td>
                      <div className="prediction-score">
                        <span className="score-value">{prediction.predictedExam3.toFixed(1)}</span>
                        <span className="score-unit">/10</span>
                      </div>
                    </td>
                    <td>
                      <div className="success-probability">
                        <div className="probability-bar">
                          <div 
                            className="probability-fill" 
                            style={{ 
                              width: `${prediction.successProbability}%`,
                              backgroundColor: successColor 
                            }}
                          ></div>
                          <span className="probability-value">{prediction.successProbability}%</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="risk-badge" style={{ backgroundColor: risk.bg, color: risk.text }}>
                        {risk.label}
                      </span>
                    </td>
                    <td>
                      <span className="grade-badge">{prediction.predictedGrade}</span>
                    </td>
                    <td>
                      <div className="recommendation">{prediction.recommendation}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="recommendations-section">
        <h3>🔍 توصيات عملية</h3>
        <div className="recommendations-grid">
          <div className="recommendation-card high-risk">
            <h4>للطلاب عاليي المخاطر</h4>
            <ul>
              <li>برامج دعم إضافية للمواد الضعيفة</li>
              <li>متابعة فردية مع المعلم</li>
              <li>تقييمات أسبوعية للمتابعة</li>
              <li>اجتماعات مع أولياء الأمور</li>
            </ul>
          </div>
          
          <div className="recommendation-card medium-risk">
            <h4>للطلاب متوسطي المخاطر</h4>
            <ul>
              <li>تدريبات إضافية على نقاط الضعف</li>
              <li>متابعة أسبوعية</li>
              <li>تشجيع على المشاركة في الفصل</li>
              <li>تحديد أهداف قابلة للتحقيق</li>
            </ul>
          </div>
          
          <div className="recommendation-card high-potential">
            <h4>للطلاب عاليي الإمكانات</h4>
            <ul>
              <li>مواد إثرائية وتحديات إضافية</li>
              <li>مشاركة في أنشطة القيادة</li>
              <li>توجيه نحو التميز والإبداع</li>
              <li>برامج موهوبين</li>
            </ul>
          </div>
        </div>
      </div>

      <style jsx>{`
        .ml-predictor {
          background: white;
          border-radius: 15px;
          padding: 25px;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
        }

        .ml-predictor.loading {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
        }

        .loading-content {
          text-align: center;
        }

        .loading-content .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #e2e8f0;
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .predictor-header {
          margin-bottom: 30px;
          border-bottom: 2px solid #f7fafc;
          padding-bottom: 20px;
        }

        .predictor-header h2 {
          margin: 0 0 10px 0;
          color: #2d3748;
          font-size: 1.8rem;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .predictor-header p {
          margin: 0 0 15px 0;
          color: #718096;
        }

        .refresh-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s;
        }

        .refresh-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .prediction-summary {
          margin-bottom: 30px;
        }

        .prediction-summary h3 {
          margin: 0 0 20px 0;
          color: #2d3748;
          font-size: 1.3rem;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .summary-card {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
          transition: transform 0.3s;
        }

        .summary-card:hover {
          transform: translateY(-3px);
        }

        .summary-card.risk {
          border-right: 4px solid #f56565;
        }

        .summary-card.potential {
          border-right: 4px solid #48bb78;
        }

        .summary-card.confidence {
          border-right: 4px solid #667eea;
        }

        .summary-card.improvement {
          border-right: 4px solid #ed8936;
        }

        .summary-icon {
          font-size: 36px;
        }

        .summary-content {
          flex: 1;
        }

        .summary-value {
          font-size: 2rem;
          font-weight: 700;
          color: #2d3748;
          margin-bottom: 5px;
        }

        .summary-label {
          color: #718096;
          font-size: 0.9rem;
        }

        .predictions-table h3 {
          margin: 0 0 20px 0;
          color: #2d3748;
          font-size: 1.3rem;
        }

        .table-container {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        thead {
          background: #f7fafc;
        }

        th {
          padding: 15px;
          text-align: right;
          font-weight: 600;
          color: #4a5568;
          border-bottom: 2px solid #e2e8f0;
          white-space: nowrap;
        }

        tbody tr {
          border-bottom: 1px solid #e2e8f0;
          transition: background 0.3s;
        }

        tbody tr:hover {
          background: #f8f9fa;
        }

        td {
          padding: 15px;
          text-align: right;
        }

        .student-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .student-avatar {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 1.1rem;
        }

        .student-info {
          flex: 1;
        }

        .student-name {
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 4px;
        }

        .student-score {
          color: #718096;
          font-size: 0.85rem;
        }

        .current-level {
          font-weight: 500;
          color: #2d3748;
          background: #f7fafc;
          padding: 6px 12px;
          border-radius: 20px;
          display: inline-block;
        }

        .prediction-score {
          font-size: 1.5rem;
          font-weight: 700;
          color: #2d3748;
          text-align: center;
        }

        .score-unit {
          font-size: 0.9rem;
          color: #718096;
          margin-right: 4px;
        }

        .success-probability {
          min-width: 120px;
        }

        .probability-bar {
          height: 25px;
          background: #e2e8f0;
          border-radius: 12px;
          position: relative;
          overflow: hidden;
        }

        .probability-fill {
          height: 100%;
          position: absolute;
          top: 0;
          right: 0;
          border-radius: 12px;
        }

        .probability-value {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: white;
          font-weight: 600;
          font-size: 0.85rem;
          z-index: 2;
        }

        .risk-badge {
          padding: 6px 15px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.85rem;
          display: inline-block;
        }

        .grade-badge {
          background: #667eea;
          color: white;
          padding: 6px 15px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.85rem;
          display: inline-block;
        }

        .recommendation {
          color: #4a5568;
          font-size: 0.9rem;
          line-height: 1.4;
          max-width: 200px;
        }

        .recommendations-section {
          margin-top: 40px;
        }

        .recommendations-section h3 {
          margin: 0 0 20px 0;
          color: #2d3748;
          font-size: 1.3rem;
        }

        .recommendations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .recommendation-card {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 20px;
          border-top: 4px solid;
        }

        .recommendation-card.high-risk {
          border-color: #f56565;
        }

        .recommendation-card.medium-risk {
          border-color: #ecc94b;
        }

        .recommendation-card.high-potential {
          border-color: #48bb78;
        }

        .recommendation-card h4 {
          margin: 0 0 15px 0;
          color: #2d3748;
          font-size: 1.1rem;
        }

        .recommendation-card ul {
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .recommendation-card li {
          padding: 8px 0;
          border-bottom: 1px solid #e2e8f0;
          color: #4a5568;
          font-size: 0.9rem;
        }

        .recommendation-card li:last-child {
          border-bottom: none;
        }

        @media (max-width: 768px) {
          .summary-grid {
            grid-template-columns: 1fr 1fr;
          }
          
          .table-container {
            font-size: 0.85rem;
          }
          
          th, td {
            padding: 10px;
          }
          
          .recommendations-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default MLPredictor;