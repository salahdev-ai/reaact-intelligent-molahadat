import React, { useState, useMemo } from 'react';
import { 
    processAllExamData, 
    calculateStatistics, 
    readExcelFile 
} from './DataProcessor';
import './Dashboard.css';

// --- Icons Component ---
const Icon = ({ name, size = 20, className = "" }) => {
    const icons = {
        upload: <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />,
        dashboard: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
        users: <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />,
        chart: <path d="M18 20V10M12 20V4M6 20v-6" />,
        search: <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35" />,
        close: <path d="M18 6L6 18M6 6l12 12" />,
        trendUp: <path d="M23 6l-9.5 9.5-5-5L1 18" />,
        trendDown: <path d="M23 18l-9.5-9.5-5 5L1 6" />,
        file: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />,
        check: <path d="M20 6L9 17l-5-5" />,
        alert: <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />,
        brain: <path d="M9.5 2a2.5 2.5 0 0 1 2 4 2.5 2.5 0 0 1 2 4 2.5 2.5 0 0 1-2 4 2.5 2.5 0 0 1-2 4 2.5 2.5 0 0 1-2-4 2.5 2.5 0 0 1-2-4 2.5 2.5 0 0 1 2-4 2.5 2.5 0 0 1 2-4z" />,
        target: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
        award: <path d="M12 15l7-7 3 3-7 7-3-3z" />,
        activity: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
        barChart2: <path d="M18 20V10M12 20V4M6 20v-6" />,
        messageSquare: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
        star: <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
        zap: <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
        book: <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20M6.5 17H20v5H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v15H6.5A2.5 2.5 0 0 0 4 19.5z" />,
        lightbulb: <path d="M9 18h6M10 22h4M15.09 14a3 3 0 0 0 .5-5 7 7 0 1 0-5.18 0 3 3 0 0 0 .5 5" />,
        flame: <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />,
        shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    };
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            {icons[name]}
        </svg>
    );
};

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('upload');
    const [files, setFiles] = useState({ exam1: null, exam2: null });
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState({ 
        students: [], 
        stats: null, 
        analytics: null,
        studentsWithComments: [] 
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLearner, setSelectedLearner] = useState(null);
    const [filterCategory, setFilterCategory] = useState('all');
    const [analyticsView, setAnalyticsView] = useState('overview');
    const [commentsSearchTerm, setCommentsSearchTerm] = useState('');
    const [selectedPerformanceFilter, setSelectedPerformanceFilter] = useState('all');

    // --- Filter Logic for students table ---
    const filteredStudents = useMemo(() => {
        let result = data.students;

        if (searchTerm) {
            result = result.filter(s => 
                s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                s.studentNumber.includes(searchTerm)
            );
        }

        if (filterCategory !== 'all') {
            if (filterCategory === 'excellent') result = result.filter(s => s.overallAverage >= 8);
            else if (filterCategory === 'good') result = result.filter(s => s.overallAverage >= 6 && s.overallAverage < 8);
            else if (filterCategory === 'average') result = result.filter(s => s.overallAverage >= 5 && s.overallAverage < 6);
            else if (filterCategory === 'poor') result = result.filter(s => s.overallAverage < 5);
        }

        return result.sort((a,b) => b.overallAverage - a.overallAverage); 
    }, [data.students, searchTerm, filterCategory]);

    // --- Filter Logic for comments ---
    const filteredComments = useMemo(() => {
        let result = data.studentsWithComments || [];

        if (commentsSearchTerm) {
            result = result.filter(s => 
                s.name.toLowerCase().includes(commentsSearchTerm.toLowerCase()) || 
                s.studentNumber.includes(commentsSearchTerm)
            );
        }

        if (selectedPerformanceFilter !== 'all') {
            result = result.filter(s => {
                const performanceLevel = s.smartComments?.performanceLevel || '';
                return performanceLevel === selectedPerformanceFilter;
            });
        }

        return result.sort((a,b) => b.overallAverage - a.overallAverage);
    }, [data.studentsWithComments, commentsSearchTerm, selectedPerformanceFilter]);

    // Handle File Processing
    const handleProcess = async () => {
        if (!files.exam1 || !files.exam2) return;
        setLoading(true);
        try {
            const buf1 = await readExcelFile(files.exam1);
            const buf2 = await readExcelFile(files.exam2);
            
            setTimeout(() => {
                const result = processAllExamData(buf1, buf2);
                const stats = calculateStatistics(result.students);
                
                if (!stats) {
                    alert("لم يتم العثور على بيانات صالحة. تأكد من تنسيق الملفات.");
                    setLoading(false);
                    return;
                }

                setData({ 
                    students: result.students, 
                    stats, 
                    analytics: result.analytics,
                    studentsWithComments: result.studentsWithComments,
                    fullAnalytics: result.fullAnalytics 
                });
                setActiveTab('overview');
                setLoading(false);
            }, 1000);
        } catch (err) {
            console.error(err);
            setLoading(false);
            alert("حدث خطأ أثناء قراءة الملفات.");
        }
    };

    // --- Component Definitions ---

    const UploadView = () => (
        <div className="upload-container fade-in">
            <div className="hero-section">
                <div className="brand-logo-lg">
                    <Icon name="brain" size={48} />
                </div>
                <h1>نظام التحليل التربوي الذكي</h1>
                <p>حول بيانات مسار إلى تقارير تفاعلية، تحليلات معمقة، وتنبؤات بالذكاء الاصطناعي</p>
            </div>
            
            <div className="upload-grid">
                {[1, 2].map(num => (
                    <div key={num} className={`upload-card ${files[`exam${num}`] ? 'active' : ''}`}>
                        <div className="upload-icon-wrapper">
                            {files[`exam${num}`] ? <Icon name="check" size={32} /> : <span className="step-num">{num}</span>}
                        </div>
                        <h3>الفرض {num === 1 ? 'الأول' : 'الثاني'}</h3>
                        <p>{files[`exam${num}`] ? files[`exam${num}`].name : "اضغط لرفع ملف Excel"}</p>
                        <input 
                            type="file" 
                            accept=".xlsx, .xls"
                            onChange={(e) => setFiles({...files, [`exam${num}`]: e.target.files[0]})}
                        />
                    </div>
                ))}
            </div>

            <button 
                className={`btn-primary large ${loading ? 'loading' : ''}`} 
                disabled={!files.exam1 || !files.exam2 || loading}
                onClick={handleProcess}
            >
                {loading ? 'جاري المعالجة...' : 'تحليل البيانات الآن'}
            </button>
        </div>
    );

    const OverviewView = () => (
        <div className="overview-container fade-in">
            {/* KPI Cards */}
            <div className="stats-grid">
                <div className="stat-card primary">
                    <div className="stat-header">
                        <Icon name="users" />
                        <span>إجمالي المتعلمين</span>
                    </div>
                    <h3>{data.stats?.count || 0}</h3>
                </div>
                <div className="stat-card success">
                    <div className="stat-header">
                        <Icon name="chart" />
                        <span>متوسط القسم</span>
                    </div>
                    <h3>{data.stats?.average || '0.00'} <small>/10</small></h3>
                </div>
                <div className="stat-card warning">
                    <div className="stat-header">
                        <Icon name="trendUp" />
                        <span>نسبة النجاح</span>
                    </div>
                    <h3>{data.stats?.passRate || '0'}%</h3>
                </div>
                <div className="stat-card info">
                    <div className="stat-header">
                        <Icon name="trendDown" />
                        <span>أعلى نقطة</span>
                    </div>
                    <h3>{data.stats?.max || '0.00'}</h3>
                </div>
            </div>

            <div className="analytics-split">
                {/* Interactive Distribution Chart */}
                <div className="panel chart-panel">
                    <div className="panel-header">
                        <div>
                            <h2>توزيع النتائج</h2>
                            <span className="subtitle">اضغط على الأعمدة لتصفية الجدول بالأسفل</span>
                        </div>
                        {filterCategory !== 'all' && (
                            <button className="clear-filter" onClick={() => setFilterCategory('all')}>
                                <Icon name="close" size={14} /> إلغاء التصفية
                            </button>
                        )}
                    </div>
                    <div className="bar-chart-container">
                        <div className="chart-bars">
                            <div 
                                className={`bar-group ${filterCategory === 'excellent' ? 'selected' : ''}`}
                                onClick={() => setFilterCategory(filterCategory === 'excellent' ? 'all' : 'excellent')}
                            >
                                <div className="bar excellent" style={{height: `${((data.stats?.distribution?.excellent || 0) / data.stats?.count * 100) || 0}%`}}>
                                    <span className="count-badge">{data.stats?.distribution?.excellent || 0}</span>
                                </div>
                                <span className="label">متفوق (+8)</span>
                            </div>
                            
                            <div 
                                className={`bar-group ${filterCategory === 'good' ? 'selected' : ''}`}
                                onClick={() => setFilterCategory(filterCategory === 'good' ? 'all' : 'good')}
                            >
                                <div className="bar good" style={{height: `${((data.stats?.distribution?.good || 0) / data.stats?.count * 100) || 0}%`}}>
                                    <span className="count-badge">{data.stats?.distribution?.good || 0}</span>
                                </div>
                                <span className="label">جيد (6-8)</span>
                            </div>

                            <div 
                                className={`bar-group ${filterCategory === 'average' ? 'selected' : ''}`}
                                onClick={() => setFilterCategory(filterCategory === 'average' ? 'all' : 'average')}
                            >
                                <div className="bar average" style={{height: `${((data.stats?.distribution?.average || 0) / data.stats?.count * 100) || 0}%`}}>
                                    <span className="count-badge">{data.stats?.distribution?.average || 0}</span>
                                </div>
                                <span className="label">متوسط (5-6)</span>
                            </div>

                            <div 
                                className={`bar-group ${filterCategory === 'poor' ? 'selected' : ''}`}
                                onClick={() => setFilterCategory(filterCategory === 'poor' ? 'all' : 'poor')}
                            >
                                <div className="bar poor" style={{height: `${((data.stats?.distribution?.poor || 0) / data.stats?.count * 100) || 0}%`}}>
                                    <span className="count-badge">{data.stats?.distribution?.poor || 0}</span>
                                </div>
                                <span className="label">دعم (&lt;5)</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subject Performance Radar (Simulated list) */}
                <div className="panel">
                    <div className="panel-header">
                        <h2>تحليل المواد</h2>
                        <span className="subtitle">الأداء حسب المادة</span>
                    </div>
                    <div className="subjects-list">
                        {data.stats?.subjectAverages?.slice(0, 5).map((sub, idx) => (
                            <div key={idx} className="subject-row">
                                <span className="sub-name">{sub.name}</span>
                                <div className="progress-track">
                                    <div 
                                        className="progress-fill" 
                                        style={{
                                            width: `${sub.value * 10}%`,
                                            backgroundColor: sub.value >= 7.5 ? '#10B981' : sub.value >= 5 ? '#F59E0B' : '#EF4444'
                                        }}
                                    ></div>
                                </div>
                                <span className="sub-val">{sub.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Students Table Section */}
            <div className="table-section">
                <div className="table-header-control">
                    <h3>قائمة المتعلمين {filterCategory !== 'all' && <span className="filter-tag">تصفية: {
                        filterCategory === 'excellent' ? 'المتفوقين' : 
                        filterCategory === 'good' ? 'المستوى الجيد' :
                        filterCategory === 'average' ? 'المتوسطين' : 'المتعثرين'
                    }</span>}</h3>
                    <div className="search-bar">
                        <Icon name="search" />
                        <input 
                            type="text" 
                            placeholder="بحث..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                
                <div className="table-wrapper">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>الاسم الكامل</th>
                                <th>تاريخ الازدياد</th>
                                <th>فرض 1</th>
                                <th>فرض 2</th>
                                <th>المعدل</th>
                                <th>التحسن</th>
                                <th>الحالة</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map((s, i) => (
                                <tr key={s.id} onClick={() => setSelectedLearner(s)}>
                                    <td><span className="rank-idx">{i+1}</span></td>
                                    <td>
                                        <div className="user-cell">
                                            <div className="avatar-sm">{s.name.charAt(0)}</div>
                                            <div className="user-meta">
                                                <span className="name">{s.name}</span>
                                                <span className="id">{s.studentNumber}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="ltr-text">{s.dateOfBirth}</td>
                                    <td>{s.exam1Average?.toFixed(2) || '0.00'}</td>
                                    <td>{s.exam2Average?.toFixed(2) || '0.00'}</td>
                                    <td><strong>{s.overallAverage?.toFixed(2) || '0.00'}</strong></td>
                                    <td>
                                        <span className={`trend-pill ${s.trend}`}>
                                            {s.improvement > 0 ? '+' : ''}{s.improvement?.toFixed(2) || '0.00'}
                                        </span>
                                    </td>
                                    <td>
                                        {s.badges?.[0] ? (
                                            <span className={`badge badge-${s.badges[0].type}`}>{s.badges[0].label}</span>
                                        ) : <span>-</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    // --- Analytics View Components ---

    const OverviewAnalytics = () => {
        if (!data.analytics) return <div className="no-data">لا توجد بيانات تحليلية</div>;
        
        const totalStudents = data.students.length;
        const atRiskCount = data.analytics?.atRiskStudents?.length || 0;
        const atRiskPercentage = totalStudents > 0 ? (atRiskCount / totalStudents * 100).toFixed(1) : 0;
        
        return (
            <div className="analytics-grid">
                {/* Performance Overview */}
                <div className="analytics-card full-width">
                    <div className="card-header">
                        <Icon name="barChart2" />
                        <h3>نظرة عامة على الأداء</h3>
                    </div>
                    <div className="performance-matrix">
                        <div className="matrix-item">
                            <span className="matrix-label">المتفوقون</span>
                            <div className="matrix-value">{data.stats?.distribution?.excellent || 0}</div>
                            <div className="matrix-progress">
                                <div className="progress-fill" style={{
                                    width: `${((data.stats?.distribution?.excellent || 0) / totalStudents * 100) || 0}%`,
                                    backgroundColor: '#10B981'
                                }}></div>
                            </div>
                        </div>
                        <div className="matrix-item">
                            <span className="matrix-label">الجيدون</span>
                            <div className="matrix-value">{data.stats?.distribution?.good || 0}</div>
                            <div className="matrix-progress">
                                <div className="progress-fill" style={{
                                    width: `${((data.stats?.distribution?.good || 0) / totalStudents * 100) || 0}%`,
                                    backgroundColor: '#3B82F6'
                                }}></div>
                            </div>
                        </div>
                        <div className="matrix-item">
                            <span className="matrix-label">المتوسطون</span>
                            <div className="matrix-value">{data.stats?.distribution?.average || 0}</div>
                            <div className="matrix-progress">
                                <div className="progress-fill" style={{
                                    width: `${((data.stats?.distribution?.average || 0) / totalStudents * 100) || 0}%`,
                                    backgroundColor: '#F59E0B'
                                }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Risk Analysis */}
                <div className="analytics-card">
                    <div className="card-header">
                        <Icon name="alert" />
                        <h3>تحليل المخاطر</h3>
                    </div>
                    <div className="risk-analysis">
                        <div className="risk-metric">
                            <span className="risk-label">المعرضون للخطر</span>
                            <div className="risk-value">
                                <span className="risk-count">{atRiskCount}</span>
                                <span className="risk-percent">({atRiskPercentage}%)</span>
                            </div>
                        </div>
                        <div className="risk-metric">
                            <span className="risk-label">المستقرون</span>
                            <div className="risk-value">
                                <span className="risk-count">{totalStudents - atRiskCount}</span>
                                <span className="risk-percent">{((totalStudents - atRiskCount) / totalStudents * 100).toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Most Improved Students */}
                <div className="analytics-card">
                    <div className="card-header">
                        <Icon name="trendUp" />
                        <h3>أكثر الطلاب تحسناً</h3>
                    </div>
                    <div className="improvement-list">
                        {data.analytics?.mostImproved?.length > 0 ? (
                            data.analytics.mostImproved.map((student, idx) => (
                                <div key={idx} className="improvement-item">
                                    <span className="rank">#{idx + 1}</span>
                                    <span className="name">{student.name}</span>
                                    <span className="improvement-value positive">+{student.improvement}</span>
                                </div>
                            ))
                        ) : (
                            <p className="no-data">لا توجد بيانات تحسن ملحوظة</p>
                        )}
                    </div>
                </div>

                {/* Performance Patterns */}
                <div className="analytics-card">
                    <div className="card-header">
                        <Icon name="activity" />
                        <h3>أنماط الأداء</h3>
                    </div>
                    <div className="patterns-summary">
                        <div className="pattern-item">
                            <Icon name="star" size={16} />
                            <span>المتفوقون باستمرار: {data.analytics?.performancePatterns?.consistentlyHigh || 0}</span>
                        </div>
                        <div className="pattern-item">
                            <Icon name="trendUp" size={16} />
                            <span>المتحسنون: {data.analytics?.performancePatterns?.improving || 0}</span>
                        </div>
                        <div className="pattern-item">
                            <Icon name="trendDown" size={16} />
                            <span>المتراجعون: {data.analytics?.performancePatterns?.declining || 0}</span>
                        </div>
                        <div className="pattern-item">
                            <Icon name="shield" size={16} />
                            <span>المستقرون: {data.analytics?.performancePatterns?.stable || 0}</span>
                        </div>
                    </div>
                </div>

                {/* At Risk Students (Only if exists) */}
                {atRiskCount > 0 && (
                    <div className="analytics-card full-width">
                        <div className="card-header">
                            <Icon name="alert" />
                            <h3>الطلاب المعرضون للخطر</h3>
                        </div>
                        <div className="risk-grid">
                            {data.analytics.atRiskStudents.slice(0, 5).map((student, idx) => (
                                <div key={idx} className="risk-card">
                                    <div className="risk-header">
                                        <span className="risk-name">{student.name}</span>
                                        <span className="risk-level high">خطر مرتفع</span>
                                    </div>
                                    <div className="risk-details">
                                        <span className="risk-avg">المعدل: {student.overallAverage?.toFixed(2)}</span>
                                        <div className="risk-factors">
                                            {student.riskFactors?.slice(0, 2).map((factor, fIdx) => (
                                                <span key={fIdx} className="risk-factor">⚠ {factor}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const PredictionsAnalytics = () => {
        if (!data.analytics) return <div className="no-data">لا توجد بيانات تحليلية</div>;
        
        const totalStudents = data.students.length;
        const successDist = data.analytics.successDistribution || { high: 0, medium: 0, low: 0 };
        
        return (
            <div className="predictions-container">
                <div className="prediction-header">
                    <h2>تنبؤات الذكاء الاصطناعي للنجاح</h2>
                    <p>تحليل تنبؤي بناءً على نمط الأداء والتحسن والاستقرار</p>
                </div>

                <div className="predictions-grid">
                    {/* Success Probability Distribution */}
                    <div className="prediction-card large">
                        <h4>توزيع احتمالات النجاح</h4>
                        <div className="probability-chart">
                            <div className="probability-item">
                                <span className="prob-label">خطر مرتفع (احتمالية نجاح &lt;50%)</span>
                                <div className="prob-bar">
                                    <div 
                                        className="prob-fill high" 
                                        style={{width: `${(successDist.high / totalStudents * 100) || 0}%`}}
                                    >
                                        <span className="prob-count">{successDist.high}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="probability-item">
                                <span className="prob-label">خطر متوسط (احتمالية نجاح 50-75%)</span>
                                <div className="prob-bar">
                                    <div 
                                        className="prob-fill medium" 
                                        style={{width: `${(successDist.medium / totalStudents * 100) || 0}%`}}
                                    >
                                        <span className="prob-count">{successDist.medium}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="probability-item">
                                <span className="prob-label">خطر منخفض (احتمالية نجاح &gt;75%)</span>
                                <div className="prob-bar">
                                    <div 
                                        className="prob-fill low" 
                                        style={{width: `${(successDist.low / totalStudents * 100) || 0}%`}}
                                    >
                                        <span className="prob-count">{successDist.low}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Prediction Factors */}
                    <div className="prediction-card">
                        <h4>عوامل التنبؤ الرئيسية</h4>
                        <div className="factors-list">
                            <div className="factor-item">
                                <span className="factor-name">المعدل الحالي</span>
                                <span className="factor-weight">40%</span>
                            </div>
                            <div className="factor-item">
                                <span className="factor-name">معدل التحسن</span>
                                <span className="factor-weight">25%</span>
                            </div>
                            <div className="factor-item">
                                <span className="factor-name">استقرار الأداء</span>
                                <span className="factor-weight">20%</span>
                            </div>
                            <div className="factor-item">
                                <span className="factor-name">نقاط القوة</span>
                                <span className="factor-weight">10%</span>
                            </div>
                            <div className="factor-item">
                                <span className="factor-name">نقاط الضعف</span>
                                <span className="factor-weight">5%</span>
                            </div>
                        </div>
                    </div>

                    {/* Next Exam Predictions */}
                    <div className="prediction-card large">
                        <h4>توقعات الفرض القادم لأعلى 5 طلاب</h4>
                        <div className="next-exam-predictions">
                            {data.students
                                .sort((a, b) => b.overallAverage - a.overallAverage)
                                .slice(0, 5)
                                .map((student, idx) => {
                                    const prediction = student.prediction || {};
                                    return (
                                        <div key={idx} className="prediction-row">
                                            <span className="student-name">{student.name}</span>
                                            <span className="current-avg">{student.overallAverage?.toFixed(2)}</span>
                                            <span className="prediction-arrow">→</span>
                                            <span className="next-prediction">{prediction.nextExamPrediction || '--'}</span>
                                            <span className="confidence">ثقة: {prediction.confidence || '0'}%</span>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const InsightsAnalytics = () => {
        if (!data.analytics) return <div className="no-data">لا توجد بيانات تحليلية</div>;
        
        return (
            <div className="insights-container">
                <div className="insights-header">
                    <h2>رؤى وتحليلات متقدمة</h2>
                    <p>اكتشاف أنماط التعلم وتحديد مجالات التحسين</p>
                </div>

                <div className="insights-grid">
                    {/* Subject Difficulty Analysis */}
                    <div className="insight-card">
                        <h4>تحليل صعوبة المواد</h4>
                        <div className="difficulty-list">
                            {data.analytics.subjectDifficulty?.slice(0, 5).map((subject, idx) => (
                                <div key={idx} className="difficulty-item">
                                    <span className="subject-name">{subject.subject}</span>
                                    <div className="difficulty-meter">
                                        <div 
                                            className="meter-fill" 
                                            style={{width: `${subject.difficulty * 10}%`}}
                                        ></div>
                                    </div>
                                    <span className="difficulty-score">{subject.difficulty}/10</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Class Performance Trends */}
                    <div className="insight-card">
                        <h4>اتجاهات أداء القسم</h4>
                        <div className="class-trends">
                            <div className="trend-item">
                                <span className="trend-label">متوسط الفرض 1</span>
                                <span className="trend-value">{data.analytics.classAverages?.exam1?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div className="trend-item">
                                <span className="trend-label">متوسط الفرض 2</span>
                                <span className="trend-value">{data.analytics.classAverages?.exam2?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div className="trend-item">
                                <span className="trend-label">متوسط التحسن</span>
                                <span className="trend-value positive">+{data.analytics.averageImprovement?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div className="trend-item">
                                <span className="trend-label">نسبة النجاح</span>
                                <span className="trend-value">{data.stats?.passRate || '0'}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Recommendations Summary */}
                    <div className="insight-card full-width">
                        <h4>توصيات جماعية للقسم</h4>
                        <div className="recommendations-grid">
                            <div className="recommendation-item urgent">
                                <h5><Icon name="alert" /> فورية</h5>
                                <ul>
                                    {data.analytics.atRiskStudents?.length > 0 && (
                                        <li>دعم مكثف للطلاب المعرضين للخطر ({data.analytics.atRiskStudents.length} طالب)</li>
                                    )}
                                    <li>مراجعة المواد الأكثر صعوبة: {data.analytics.subjectDifficulty?.[0]?.subject || '--'}</li>
                                </ul>
                            </div>
                            <div className="recommendation-item medium">
                                <h5><Icon name="target" /> متوسطة المدى</h5>
                                <ul>
                                    <li>ورش عمل للمواد ذات المعدلات المنخفضة</li>
                                    <li>تكوين مجموعات دراسة حسب مستويات الأداء</li>
                                </ul>
                            </div>
                            <div className="recommendation-item long">
                                <h5><Icon name="zap" /> طويلة المدى</h5>
                                <ul>
                                    <li>تطوير مواد تعليمية تتناسب مع أنماط التعلم المختلفة</li>
                                    <li>برنامج توجيه من المتفوقين للطلاب المتعثرين</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // --- Smart Comments Component ---
    const SmartCommentsView = () => {
        if (!data.studentsWithComments || data.studentsWithComments.length === 0) {
            return (
                <div className="comments-container">
                    <div className="no-data">لا توجد بيانات للتعليقات الذكية</div>
                </div>
            );
        }

        // Performance level colors
        const performanceLevelColors = {
            'ممتاز': 'bg-yellow-50 border-yellow-200 text-yellow-800',
            'جيد جدا': 'bg-green-50 border-green-200 text-green-800',
            'جيد': 'bg-blue-50 border-blue-200 text-blue-800',
            'مقبول': 'bg-purple-50 border-purple-200 text-purple-800',
            'ضعيف': 'bg-red-50 border-red-200 text-red-800',
            'ضعيف جداً': 'bg-red-100 border-red-300 text-red-900'
        };

        return (
            <div className="comments-container fade-in">
                {/* Comments Header */}
                <div className="comments-header">
                    <div className="header-content">
                        <Icon name="messageSquare" size={24} className="text-blue-500" />
                        <div>
                            <h2>نظام التعليقات الذكية</h2>
                            <p className="subtitle">تقييم آلي وتوجيهات مخصصة لكل متعلم</p>
                        </div>
                    </div>
                    <div className="header-stats">
                        <span>{data.studentsWithComments.length} طالب</span>
                        <span className="stats-separator">•</span>
                        <span>تم إنشاء التعليقات آلياً</span>
                    </div>
                </div>

                {/* Filters */}
                <div className="comments-filters">
                    <div className="search-bar">
                        <Icon name="search" />
                        <input 
                            type="text" 
                            placeholder="ابحث عن متعلم..." 
                            value={commentsSearchTerm}
                            onChange={(e) => setCommentsSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="performance-filters">
                        <span className="filter-label">تصفية حسب المستوى:</span>
                        <div className="filter-buttons">
                            <button 
                                className={`filter-btn ${selectedPerformanceFilter === 'all' ? 'active' : ''}`}
                                onClick={() => setSelectedPerformanceFilter('all')}
                            >
                                الكل
                            </button>
                            <button 
                                className={`filter-btn ${selectedPerformanceFilter === 'ممتاز' ? 'active' : ''}`}
                                onClick={() => setSelectedPerformanceFilter('ممتاز')}
                            >
                                ممتاز
                            </button>
                            <button 
                                className={`filter-btn ${selectedPerformanceFilter === 'جيد جدا' ? 'active' : ''}`}
                                onClick={() => setSelectedPerformanceFilter('جيد جدا')}
                            >
                                جيد جداً
                            </button>
                            <button 
                                className={`filter-btn ${selectedPerformanceFilter === 'جيد' ? 'active' : ''}`}
                                onClick={() => setSelectedPerformanceFilter('جيد')}
                            >
                                جيد
                            </button>
                            <button 
                                className={`filter-btn ${selectedPerformanceFilter === 'مقبول' ? 'active' : ''}`}
                                onClick={() => setSelectedPerformanceFilter('مقبول')}
                            >
                                مقبول
                            </button>
                            <button 
                                className={`filter-btn ${selectedPerformanceFilter === 'ضعيف' ? 'active' : ''}`}
                                onClick={() => setSelectedPerformanceFilter('ضعيف')}
                            >
                                ضعيف
                            </button>
                        </div>
                    </div>
                </div>

                {/* Comments List */}
                <div className="comments-grid">
                    {filteredComments.map((student, index) => {
                        const comments = student.smartComments || {};
                        
                        return (
                            <div key={index} className="comment-card">
                                {/* Student Header */}
                                <div className={`comment-header ${performanceLevelColors[comments.performanceLevel] || ''}`}>
                                    <div className="student-info">
                                        <div className="student-avatar">
                                            {student.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="student-name">{student.name}</h3>
                                            <div className="student-meta">
                                                <span className="student-id">{student.studentNumber}</span>
                                                <span className="student-avg">المعدل: {student.overallAverage?.toFixed(2)}/10</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="performance-badge">
                                        <span className={`badge-level ${comments.performanceLevel || ''}`}>
                                            {comments.performanceLevel || 'غير محدد'}
                                        </span>
                                        <Icon name="star" className="star-icon" />
                                    </div>
                                </div>
                                
                                {/* Comments Content */}
                                <div className="comment-content">
                                    {/* Overall Assessment */}
                                    <div className="comment-section">
                                        <div className="section-header">
                                            <Icon name="target" size={16} />
                                            <h4>التقييم العام</h4>
                                        </div>
                                        <p className="comment-text">{comments.overallComment || 'لا يوجد تقييم'}</p>
                                    </div>
                                    
                                    {/* Improvement Advice */}
                                    <div className="comment-section">
                                        <div className="section-header">
                                            <Icon name="trendUp" size={16} />
                                            <h4>نصائح للتحسين</h4>
                                        </div>
                                        <p className="comment-text">{comments.improvementAdvice || 'لا يوجد نصائح'}</p>
                                    </div>
                                    
                                    {/* Parent Guidance */}
                                    <div className="comment-section">
                                        <div className="section-header">
                                            <Icon name="users" size={16} />
                                            <h4>توجيه للأولياء</h4>
                                        </div>
                                        <p className="comment-text">{comments.parentGuidance || 'لا يوجد توجيه'}</p>
                                    </div>
                                    
                                    {/* Motivational Quote */}
                                    <div className="motivational-section">
                                        <div className="section-header">
                                            <Icon name="lightbulb" size={16} />
                                            <h4>حكمة اليوم</h4>
                                        </div>
                                        <p className="quote-text">{comments.motivationalQuote || 'لا يوجد حكمة'}</p>
                                    </div>
                                    
                                    {/* Subject Comments */}
                                    {comments.subjectComments && Object.keys(comments.subjectComments).length > 0 && (
                                        <div className="subject-comments">
                                            <div className="section-header">
                                                <Icon name="book" size={16} />
                                                <h4>تقييم المواد</h4>
                                            </div>
                                            <div className="subject-grid">
                                                {Object.entries(comments.subjectComments).slice(0, 6).map(([subject, comment], idx) => (
                                                    <div key={idx} className="subject-item">
                                                        <div className="subject-name">{subject}</div>
                                                        <div className="subject-comment">{comment}</div>
                                                        {comments.subjectAdvice && comments.subjectAdvice[subject] && (
                                                            <div className="subject-advice">
                                                                <Icon name="zap" size={12} />
                                                                <span>{comments.subjectAdvice[subject]}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Weak & Strong Subjects */}
                                    {(comments.weakSubjects?.length > 0 || comments.strongSubjects?.length > 0) && (
                                        <div className="strength-weakness">
                                            {comments.strongSubjects?.length > 0 && (
                                                <div className="strengths">
                                                    <span className="label">نقاط القوة:</span>
                                                    <div className="tags">
                                                        {comments.strongSubjects.map((subject, idx) => (
                                                            <span key={idx} className="tag tag-green">✓ {subject}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {comments.weakSubjects?.length > 0 && (
                                                <div className="weaknesses">
                                                    <span className="label">نقاط الضعف:</span>
                                                    <div className="tags">
                                                        {comments.weakSubjects.map((subject, idx) => (
                                                            <span key={idx} className="tag tag-red">⚠ {subject}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Footer */}
                                <div className="comment-footer">
                                    <div className="footer-note">
                                        <Icon name="messageSquare" size={14} />
                                        <span>تم إنشاء التعليقات آلياً بناءً على أداء الطالب</span>
                                    </div>
                                    <button 
                                        className="view-profile-btn"
                                        onClick={() => setSelectedLearner(student)}
                                    >
                                        عرض الملف الشخصي
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {/* Info Note */}
                <div className="info-note">
                    <div className="note-content">
                        <Icon name="messageSquare" size={18} />
                        <div>
                            <p className="note-title">ملاحظة:</p>
                            <p className="note-text">
                                التعليقات أعلاه تم إنشاؤها آلياً بناءً على أداء المتعلمين. يمكن تعديلها حسب الحاجة.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const AnalyticsView = () => (
        <div className="analytics-container fade-in">
            {/* Analytics Navigation */}
            <div className="analytics-nav">
                <button 
                    className={analyticsView === 'overview' ? 'active' : ''}
                    onClick={() => setAnalyticsView('overview')}
                >
                    <Icon name="dashboard" /> نظرة عامة
                </button>
                <button 
                    className={analyticsView === 'predictions' ? 'active' : ''}
                    onClick={() => setAnalyticsView('predictions')}
                >
                    <Icon name="brain" /> تنبؤات الذكاء الاصطناعي
                </button>
                <button 
                    className={analyticsView === 'insights' ? 'active' : ''}
                    onClick={() => setAnalyticsView('insights')}
                >
                    <Icon name="target" /> رؤى متقدمة
                </button>
                <button 
                    className={analyticsView === 'comments' ? 'active' : ''}
                    onClick={() => setAnalyticsView('comments')}
                >
                    <Icon name="messageSquare" /> التعليقات الذكية
                </button>
            </div>

            {/* Analytics Content */}
            <div className="analytics-content">
                {analyticsView === 'overview' && <OverviewAnalytics />}
                {analyticsView === 'predictions' && <PredictionsAnalytics />}
                {analyticsView === 'insights' && <InsightsAnalytics />}
                {analyticsView === 'comments' && <SmartCommentsView />}
            </div>
        </div>
    );

    // Navigation Menu
    const navMenu = (
        <nav className="nav-menu">
            <button onClick={() => setActiveTab('upload')} className={activeTab === 'upload' ? 'active' : ''}>
                <Icon name="upload" /> الرئيسية
            </button>
            <button onClick={() => setActiveTab('overview')} disabled={!data.stats} className={activeTab === 'overview' ? 'active' : ''}>
                <Icon name="dashboard" /> لوحة التحكم
            </button>
            <button onClick={() => setActiveTab('analytics')} disabled={!data.stats} className={activeTab === 'analytics' ? 'active' : ''}>
                <Icon name="brain" /> التحليلات المتقدمة
            </button>
        </nav>
    );

    // Main Render
    return (
        <div className="app-shell" dir="rtl">
            <aside className="sidebar">
                <div className="logo-area">
                    <Icon name="brain" className="logo-spin" />
                    <span>Molahadati AI</span>
                </div>
                {navMenu}
                <div className="sidebar-footer">
                    <p>SALAH EDDINE EL SORY ي</p>
                </div>
            </aside>

            <main className="main-area">
                <header className="top-header">
                    <div className="breadcrumbs">
                        <span>
                            {activeTab === 'upload' ? 'الرئيسية' : 
                             activeTab === 'overview' ? 'لوحة القيادة' : 
                             'التحليلات المتقدمة'}
                        </span>
                    </div>
                    <div className="user-profile">
                        <div className="avatar-circle">م</div>
                        <span>Developer: Salah Eddine El sory</span>
                    </div>
                </header>

                <div className="content-scroll">
                    {activeTab === 'upload' && <UploadView />}
                    {activeTab === 'overview' && data.stats && <OverviewView />}
                    {activeTab === 'analytics' && data.analytics && <AnalyticsView />}
                </div>
            </main>

            {/* Enhanced Modal with AI Insights */}
            {selectedLearner && (
                <div className="modal-overlay" onClick={() => setSelectedLearner(null)}>
                    <div className="modal-glass large" onClick={e => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setSelectedLearner(null)}><Icon name="close" /></button>
                        
                        <div className="modal-header">
                            <div className="modal-avatar">{selectedLearner.name.charAt(0)}</div>
                            <div className="modal-title">
                                <h2>{selectedLearner.name}</h2>
                                <p>{selectedLearner.studentNumber} | {selectedLearner.dateOfBirth}</p>
                                <div className="modal-badges">
                                    {selectedLearner.badges?.map((badge, idx) => (
                                        <span key={idx} className={`badge badge-${badge.type}`}>
                                            {badge.icon} {badge.label}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="modal-score">
                                <span>{selectedLearner.overallAverage?.toFixed(2)}</span>
                                <small>المعدل العام</small>
                            </div>
                        </div>

                        <div className="modal-grid">
                            {/* AI Prediction Section */}
                            <div className="modal-widget full-width">
                                <h4>تحليل الذكاء الاصطناعي</h4>
                                <div className="ai-analysis">
                                    <div className="ai-metric">
                                        <span className="metric-label">احتمالية النجاح</span>
                                        <div className="metric-value">
                                            <span className="probability">{selectedLearner.prediction?.successProbability || '--'}%</span>
                                            <div className="probability-bar">
                                                <div 
                                                    className="probability-fill" 
                                                    style={{width: `${selectedLearner.prediction?.successProbability || 0}%`}}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ai-metric">
                                        <span className="metric-label">مستوى المخاطرة</span>
                                        <span className={`risk-level ${selectedLearner.prediction?.riskLevel || 'low'}`}>
                                            {selectedLearner.prediction?.riskLevel === 'high' ? 'مرتفع' : 
                                             selectedLearner.prediction?.riskLevel === 'medium' ? 'متوسط' : 'منخفض'}
                                        </span>
                                    </div>
                                    <div className="ai-metric">
                                        <span className="metric-label">توقع الفرض القادم</span>
                                        <span className="next-exam-pred">{selectedLearner.prediction?.nextExamPrediction || '--'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Smart Comments */}
                            <div className="modal-widget">
                                <h4>التقييم الذكي</h4>
                                <div className="smart-comments">
                                    <p className="overall-comment">{selectedLearner.comments}</p>
                                    {selectedLearner.detailedComments?.slice(0, 3).map((comment, idx) => (
                                        <div key={idx} className="detail-comment">
                                            <Icon name="check" size={14} />
                                            <span>{comment}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Learning Profile */}
                            <div className="modal-widget">
                                <h4>الملف التعليمي</h4>
                                <div className="learning-profile">
                                    <div className="profile-item">
                                        <span className="profile-label">نمط التعلم:</span>
                                        <span className="profile-value">{selectedLearner.learningProfile?.learningStyle || '--'}</span>
                                    </div>
                                    <div className="profile-item">
                                        <span className="profile-label">التصنيف:</span>
                                        <span className="profile-value">{selectedLearner.learningProfile?.type || '--'}</span>
                                    </div>
                                    <div className="profile-item">
                                        <span className="profile-label">مستوى الاستقرار:</span>
                                        <span className="profile-value">{selectedLearner.consistency || '--'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Recommendations */}
                            <div className="modal-widget full-width">
                                <h4>توصيات مخصصة</h4>
                                <div className="recommendations-list">
                                    {selectedLearner.prediction?.recommendations?.slice(0, 4).map((rec, idx) => (
                                        <div key={idx} className="recommendation-item">
                                            <Icon name="target" size={16} />
                                            <span>{rec}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;