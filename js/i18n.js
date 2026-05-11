// === js/i18n.js ===
/* ============================================================
   Internationalization (i18n) System
   ============================================================ */
var i18n = {
  currentLang: 'ja',

  translations: {
    ja: {
      app_name: '健康日記', app_subtitle: '〜慢性疾患の寛解をサポート〜',
      dashboard: 'ホーム', record: '記録する', actions: 'アクション', research: '最新研究',
      ask_ai: '相談する', integrations: '連携', settings: '設定', admin: '管理パネル',
      quick_input_placeholder: '今日の体調は？（例：頭痛がする、生理2日目で辛い、昨日よく眠れた...）',
      send: '送信', advice: 'アドバイス', your_recommendations: 'あなたへの推奨',
      recent_records: '最近の記録', trend: 'トレンド', fatigue: '疲労度', pain: '痛み',
      brain_fog: '脳霧', sleep: '睡眠', last_updated: '最終更新', view_all: 'すべて見る',
      data_input: 'データ入力', diary: '日記・フリーテキスト入力', category: 'カテゴリ',
      date: '日付', title: 'タイトル', content: '内容', save_and_analyze: '保存して分析',
      clear: 'クリア', file_upload: 'ファイルアップロード',
      profile: 'プロフィール・基本情報', age: '年齢', gender: '性別',
      male: '男性', female: '女性', other: 'その他',
      height: '身長', weight: '体重', location: '居住地', language: '言語',
      save_profile: 'プロフィールを保存', logout: 'ログアウト',
      data_export: 'すべてのデータをエクスポート', data_import: 'データインポート',
      select_diseases: '対象疾患を選択', search_diseases: '疾患名で検索...',
      step1: 'Step 1: 対象疾患を選択', step2: 'Step 2: ログイン',
      login_google: 'Googleでログイン', or: 'または',
      email: 'メールアドレス', password: 'パスワード', login: 'ログイン',
      selected: '件選択中', items: '件',
      loading: '読み込み中...', analyzing: '分析中...', saved: '保存しました', error: 'エラー',
      privacy_settings: 'プライバシー設定', data_management: 'データ管理',
      target_diseases: '対象疾患', save_diseases: '疾患を保存',
      notes: '備考（アレルギー・既往歴など）', travel_range: '通院範囲',
      delete_account: 'アカウントを完全削除（退会）', back: '← 戻る',
      try_now: 'まずはお試しください（登録不要）',
      try_input_hint: '今の体調や気になること、お薬の写真などを入れてみてください',
      ask_button: '聞いてみる', photo: '写真', sample_record: 'サンプル記録で試してみる',
      doctor_report_sample: '医師提出レポートのサンプルを見る',
      select_symptoms_hint: 'お持ちの症状を選ぶと、より的確な情報をお伝えできます（任意）',
      features_title: 'このサービスでできること',
      feat_record: '体調を記録 — テキスト・写真・ファイルで日々の症状、服薬、食事、気分を記録',
      feat_visualize: '経過を可視化 — 記録データの時系列表示と傾向の整理',
      feat_research: '研究情報の収集 — 最新の研究情報を疾患別に自動取得（参考情報）',
      feat_assist: '情報の整理補助 — 入力内容に基づく参考情報の提示（医療行為ではありません）',
      register_free: '無料で登録する',
      sign_up_free: '無料で登録して使う',
      retry: '再試行', reload_page: 'ページを再読み込み',
      disclaimer: '※本情報は参考情報です。健康上の判断は必ず医師にご相談ください。',
      your_records: 'あなたの記録',
    },
    en: {
      app_name: 'Health Diary', app_subtitle: '~ Supporting chronic illness remission ~',
      dashboard: 'Home', record: 'Record', actions: 'Actions', research: 'Research',
      ask_ai: 'Consult', integrations: 'Connect', settings: 'Settings', admin: 'Admin',
      quick_input_placeholder: 'How are you feeling today? (e.g., headache, slept well, took medicine...)',
      send: 'Send', advice: 'Advice', your_recommendations: 'Recommendations for You',
      recent_records: 'Recent Records', trend: 'Trends', fatigue: 'Fatigue', pain: 'Pain',
      brain_fog: 'Brain Fog', sleep: 'Sleep', last_updated: 'Last updated', view_all: 'View all',
      data_input: 'Data Entry', diary: 'Diary / Free Text', category: 'Category',
      date: 'Date', title: 'Title', content: 'Content', save_and_analyze: 'Save & Analyze',
      clear: 'Clear', file_upload: 'File Upload',
      profile: 'Profile', age: 'Age', gender: 'Gender',
      male: 'Male', female: 'Female', other: 'Other',
      height: 'Height', weight: 'Weight', location: 'Location', language: 'Language',
      save_profile: 'Save Profile', logout: 'Logout',
      data_export: 'Export All Data', data_import: 'Import Data',
      select_diseases: 'Select Your Conditions', search_diseases: 'Search conditions...',
      step1: 'Step 1: Select Conditions', step2: 'Step 2: Sign In',
      login_google: 'Sign in with Google', or: 'or',
      email: 'Email', password: 'Password', login: 'Sign In',
      selected: 'selected', items: 'items',
      loading: 'Loading...', analyzing: 'Analyzing...', saved: 'Saved', error: 'Error',
      privacy_settings: 'Privacy Settings', data_management: 'Data Management',
      target_diseases: 'Target Conditions', save_diseases: 'Save Conditions',
      notes: 'Notes (allergies, medical history, etc.)', travel_range: 'Travel range for clinics',
      delete_account: 'Delete Account Permanently', back: '← Back',
      try_now: 'Try it now (no sign-up required)',
      try_input_hint: 'Enter how you feel, concerns, or attach a photo of your medication',
      ask_button: 'Ask', photo: 'Photo', sample_record: 'Try with sample data',
      doctor_report_sample: 'View doctor report sample',
      select_symptoms_hint: 'Select your conditions for more specific insights (optional)',
      features_title: 'What this service can do',
      feat_record: 'Record health — Track daily symptoms, medications, meals & mood via text, photos & files',
      feat_visualize: 'Visualize progress — Timeline view and trend analysis of your records',
      feat_research: 'Research updates — Auto-fetch latest research by condition (reference only)',
      feat_assist: 'Information assistant — Reference information based on your input (not medical advice)',
      register_free: 'Sign Up Free',
      sign_up_free: 'Sign up free',
      retry: 'Retry', reload_page: 'Reload page',
      disclaimer: '* This is reference information only. Please consult your doctor for health decisions.',
      your_records: 'Your Records',
    },
    zh: {
      app_name: '健康日记', app_subtitle: '〜慢性疾病的缓解支持〜',
      dashboard: '首页', record: '记录', actions: '行动', research: '研究',
      ask_ai: '咨询', integrations: '连接', settings: '设置', admin: '管理',
      quick_input_placeholder: '今天身体怎么样？（例：头痛、失眠、吃了什么药...）',
      send: '发送', advice: '建议', your_recommendations: '推荐',
      recent_records: '最近记录', trend: '趋势', fatigue: '疲劳', pain: '疼痛',
      brain_fog: '脑雾', sleep: '睡眠', last_updated: '最后更新', view_all: '查看全部',
      data_input: '数据录入', diary: '日记', category: '类别',
      date: '日期', title: '标题', content: '内容', save_and_analyze: '保存并分析',
      clear: '清除', file_upload: '文件上传',
      profile: '个人资料', age: '年龄', gender: '性别',
      male: '男', female: '女', other: '其他',
      height: '身高', weight: '体重', location: '位置', language: '语言',
      save_profile: '保存', logout: '退出',
      data_export: '导出所有数据', data_import: '导入数据',
      select_diseases: '选择疾病', search_diseases: '搜索疾病...',
      step1: '第1步：选择疾病', step2: '第2步：登录',
      login_google: '使用Google登录', or: '或者',
      email: '电子邮件', password: '密码', login: '登录',
      selected: '已选', items: '条',
      loading: '加载中...', analyzing: '分析中...', saved: '已保存', error: '错误',
      privacy_settings: '隐私设置', data_management: '数据管理',
      target_diseases: '目标疾病', save_diseases: '保存疾病',
      notes: '备注（过敏、病史等）', travel_range: '就诊范围',
      delete_account: '永久删除账户', back: '← 返回',
      try_now: '先试试（无需注册）', try_input_hint: '输入您的身体状况或上传药物照片',
      ask_button: '咨询', photo: '照片', sample_record: '用示例数据试试',
      doctor_report_sample: '查看医生报告样本',
      select_symptoms_hint: '选择您的症状可获得更精准的信息（可选）',
      features_title: '本服务功能',
      feat_record: '记录健康 — 通过文字、照片记录每日症状、用药、饮食',
      feat_visualize: '可视化 — 时间线和趋势分析',
      feat_research: '研究信息 — 按疾病自动获取最新研究（参考信息）',
      feat_assist: '信息整理 — 基于输入提供参考信息（非医疗行为）',
      register_free: '免费注册', sign_up_free: '免费注册使用',
      retry: '重试', reload_page: '重新加载',
      disclaimer: '※以上为参考信息。健康决策请咨询医生。',
      your_records: '您的记录',
    },
    ko: {
      app_name: '건강 일기', app_subtitle: '〜만성질환 관해 서포트〜',
      dashboard: '홈', record: '기록', actions: '액션', research: '연구',
      ask_ai: '상담', integrations: '연결', settings: '설정', admin: '관리',
      quick_input_placeholder: '오늘 몸 상태는? (예: 두통, 피곤함, 약 복용...)',
      send: '보내기', advice: '조언', your_recommendations: '추천',
      recent_records: '최근 기록', trend: '트렌드', fatigue: '피로도', pain: '통증',
      brain_fog: '브레인 포그', sleep: '수면', last_updated: '마지막 업데이트', view_all: '전체보기',
      data_input: '데이터 입력', diary: '일기', category: '카테고리',
      date: '날짜', title: '제목', content: '내용', save_and_analyze: '저장 및 분석',
      clear: '지우기', file_upload: '파일 업로드',
      profile: '프로필', age: '나이', gender: '성별',
      male: '남성', female: '여성', other: '기타',
      height: '키', weight: '몸무게', location: '거주지', language: '언어',
      save_profile: '프로필 저장', logout: '로그아웃',
      data_export: '모든 데이터 내보내기', data_import: '데이터 가져오기',
      select_diseases: '질환 선택', search_diseases: '질환 검색...',
      step1: '1단계: 질환 선택', step2: '2단계: 로그인',
      login_google: 'Google로 로그인', or: '또는',
      email: '이메일', password: '비밀번호', login: '로그인',
      selected: '선택됨', items: '건',
      loading: '로딩 중...', analyzing: '분석 중...', saved: '저장됨', error: '오류',
      privacy_settings: '개인정보 설정', data_management: '데이터 관리',
      target_diseases: '대상 질환', save_diseases: '질환 저장',
      notes: '메모 (알레르기, 병력 등)', travel_range: '통원 범위',
      delete_account: '계정 영구 삭제', back: '← 뒤로',
      try_now: '먼저 체험해보세요 (가입 불필요)', try_input_hint: '몸 상태나 약 사진을 입력해보세요',
      ask_button: '질문하기', photo: '사진', sample_record: '샘플 데이터로 체험',
      doctor_report_sample: '의사 리포트 샘플 보기',
      select_symptoms_hint: '증상을 선택하면 더 정확한 정보를 제공합니다 (선택사항)',
      features_title: '이 서비스의 기능',
      feat_record: '건강 기록 — 텍스트·사진으로 매일의 증상, 약, 식사 기록',
      feat_visualize: '경과 시각화 — 타임라인과 트렌드 분석',
      feat_research: '연구 정보 — 질환별 최신 연구 자동 수집 (참고용)',
      feat_assist: '정보 정리 — 입력에 기반한 참고 정보 제공 (의료 행위 아님)',
      register_free: '무료 가입', sign_up_free: '무료로 가입하여 사용',
      retry: '재시도', reload_page: '페이지 새로고침',
      disclaimer: '※참고 정보입니다. 건강 판단은 반드시 의사와 상담하세요.',
      your_records: '나의 기록',
    },
    es: {
      app_name: 'Diario de Salud', app_subtitle: '~ Apoyo para la remisión de enfermedades crónicas ~',
      dashboard: 'Inicio', record: 'Registrar', actions: 'Acciones', research: 'Investigación',
      ask_ai: 'Consultar', integrations: 'Conectar', settings: 'Ajustes', admin: 'Admin',
      quick_input_placeholder: '¿Cómo te sientes hoy? (ej: dolor de cabeza, dormí bien...)',
      send: 'Enviar', advice: 'Consejo', your_recommendations: 'Recomendaciones',
      recent_records: 'Registros recientes', trend: 'Tendencias', fatigue: 'Fatiga', pain: 'Dolor',
      brain_fog: 'Niebla mental', sleep: 'Sueño', last_updated: 'Última actualización', view_all: 'Ver todo',
      save_and_analyze: 'Guardar y analizar', clear: 'Borrar', logout: 'Cerrar sesión',
      profile: 'Perfil', age: 'Edad', gender: 'Género', male: 'Masculino', female: 'Femenino', other: 'Otro',
      height: 'Altura', weight: 'Peso', location: 'Ubicación', language: 'Idioma',
      save_profile: 'Guardar perfil', login_google: 'Iniciar sesión con Google', login: 'Iniciar sesión',
      email: 'Correo electrónico', password: 'Contraseña', or: 'o',
      selected: 'seleccionados', items: 'elementos',
      loading: 'Cargando...', analyzing: 'Analizando...', saved: 'Guardado', error: 'Error',
      try_now: 'Pruébalo ahora (sin registro)', ask_button: 'Preguntar', photo: 'Foto',
      register_free: 'Registrarse gratis', retry: 'Reintentar', reload_page: 'Recargar página',
      disclaimer: '* Información de referencia. Consulte a su médico para decisiones de salud.',
      your_records: 'Tus registros', features_title: 'Funciones del servicio',
      feat_record: 'Registrar salud — Síntomas, medicamentos, comidas y estado de ánimo',
      feat_visualize: 'Visualizar — Línea de tiempo y análisis de tendencias',
      feat_research: 'Investigación — Información actualizada por enfermedad',
      feat_assist: 'Asistente — Información de referencia (no es consejo médico)',
    },
    fr: {
      app_name: 'Journal de Santé', app_subtitle: '~ Soutien à la rémission des maladies chroniques ~',
      dashboard: 'Accueil', record: 'Enregistrer', actions: 'Actions', research: 'Recherche',
      ask_ai: 'Consulter', integrations: 'Connexions', settings: 'Paramètres', admin: 'Admin',
      quick_input_placeholder: 'Comment vous sentez-vous aujourd\'hui ? (ex: mal de tête, bien dormi...)',
      send: 'Envoyer', advice: 'Conseil', your_recommendations: 'Recommandations',
      recent_records: 'Enregistrements récents', trend: 'Tendances', fatigue: 'Fatigue', pain: 'Douleur',
      brain_fog: 'Brouillard cérébral', sleep: 'Sommeil', last_updated: 'Dernière mise à jour', view_all: 'Tout voir',
      save_and_analyze: 'Sauvegarder et analyser', clear: 'Effacer', logout: 'Déconnexion',
      profile: 'Profil', age: 'Âge', gender: 'Genre', male: 'Homme', female: 'Femme', other: 'Autre',
      height: 'Taille', weight: 'Poids', location: 'Lieu', language: 'Langue',
      save_profile: 'Sauvegarder le profil', login_google: 'Se connecter avec Google', login: 'Connexion',
      email: 'E-mail', password: 'Mot de passe', or: 'ou',
      selected: 'sélectionnés', items: 'éléments',
      loading: 'Chargement...', analyzing: 'Analyse...', saved: 'Sauvegardé', error: 'Erreur',
      try_now: 'Essayez maintenant (sans inscription)', ask_button: 'Demander', photo: 'Photo',
      register_free: 'S\'inscrire gratuitement', retry: 'Réessayer', reload_page: 'Recharger',
      disclaimer: '* Information de référence. Consultez votre médecin pour les décisions de santé.',
      your_records: 'Vos enregistrements', features_title: 'Fonctionnalités',
    },
    de: {
      app_name: 'Gesundheitstagebuch', app_subtitle: '~ Unterstützung bei chronischen Erkrankungen ~',
      dashboard: 'Startseite', record: 'Aufzeichnen', actions: 'Aktionen', research: 'Forschung',
      ask_ai: 'Beratung', integrations: 'Verbindungen', settings: 'Einstellungen', admin: 'Admin',
      quick_input_placeholder: 'Wie fühlen Sie sich heute? (z.B.: Kopfschmerzen, gut geschlafen...)',
      send: 'Senden', advice: 'Rat', logout: 'Abmelden',
      profile: 'Profil', age: 'Alter', gender: 'Geschlecht', male: 'Männlich', female: 'Weiblich', other: 'Andere',
      height: 'Größe', weight: 'Gewicht', location: 'Standort', language: 'Sprache',
      save_profile: 'Profil speichern', login_google: 'Mit Google anmelden', login: 'Anmelden',
      email: 'E-Mail', password: 'Passwort', or: 'oder',
      loading: 'Laden...', analyzing: 'Analysiere...', saved: 'Gespeichert', error: 'Fehler',
      try_now: 'Jetzt ausprobieren (ohne Anmeldung)', ask_button: 'Fragen', photo: 'Foto',
      register_free: 'Kostenlos registrieren', retry: 'Erneut versuchen', reload_page: 'Seite neu laden',
      disclaimer: '* Referenzinformation. Konsultieren Sie Ihren Arzt für Gesundheitsentscheidungen.',
      your_records: 'Ihre Aufzeichnungen', features_title: 'Funktionen',
    },
    pt: {
      app_name: 'Diário de Saúde', app_subtitle: '~ Apoio para remissão de doenças crônicas ~',
      dashboard: 'Início', record: 'Registrar', actions: 'Ações', research: 'Pesquisa',
      ask_ai: 'Consultar', integrations: 'Conexões', settings: 'Configurações', admin: 'Admin',
      send: 'Enviar', advice: 'Conselho', logout: 'Sair',
      profile: 'Perfil', age: 'Idade', gender: 'Gênero', male: 'Masculino', female: 'Feminino', other: 'Outro',
      height: 'Altura', weight: 'Peso', location: 'Local', language: 'Idioma',
      login_google: 'Entrar com Google', login: 'Entrar', email: 'E-mail', password: 'Senha', or: 'ou',
      loading: 'Carregando...', analyzing: 'Analisando...', saved: 'Salvo', error: 'Erro',
      try_now: 'Experimente agora (sem cadastro)', ask_button: 'Perguntar', photo: 'Foto',
      register_free: 'Cadastre-se grátis', retry: 'Tentar novamente', reload_page: 'Recarregar',
      disclaimer: '* Informação de referência. Consulte seu médico para decisões de saúde.',
    },
    th: {
      app_name: 'ไดอารี่สุขภาพ', app_subtitle: '~ สนับสนุนการหายจากโรคเรื้อรัง ~',
      dashboard: 'หน้าแรก', record: 'บันทึก', actions: 'การดำเนินการ', research: 'งานวิจัย',
      ask_ai: 'ปรึกษา', settings: 'ตั้งค่า', send: 'ส่ง', logout: 'ออกจากระบบ',
      profile: 'โปรไฟล์', age: 'อายุ', gender: 'เพศ', height: 'ส่วนสูง', weight: 'น้ำหนัก',
      language: 'ภาษา', login_google: 'เข้าสู่ระบบด้วย Google', login: 'เข้าสู่ระบบ',
      email: 'อีเมล', password: 'รหัสผ่าน',
      loading: 'กำลังโหลด...', analyzing: 'กำลังวิเคราะห์...', saved: 'บันทึกแล้ว', error: 'ข้อผิดพลาด',
      try_now: 'ลองเลย (ไม่ต้องสมัคร)', ask_button: 'ถาม', photo: 'รูปถ่าย',
      register_free: 'สมัครฟรี', retry: 'ลองอีกครั้ง',
    },
    vi: {
      app_name: 'Nhật ký Sức khỏe', app_subtitle: '~ Hỗ trợ thuyên giảm bệnh mãn tính ~',
      dashboard: 'Trang chủ', record: 'Ghi chép', actions: 'Hành động', research: 'Nghiên cứu',
      ask_ai: 'Tư vấn', settings: 'Cài đặt', send: 'Gửi', logout: 'Đăng xuất',
      profile: 'Hồ sơ', age: 'Tuổi', gender: 'Giới tính', height: 'Chiều cao', weight: 'Cân nặng',
      language: 'Ngôn ngữ', login_google: 'Đăng nhập bằng Google', login: 'Đăng nhập',
      email: 'Email', password: 'Mật khẩu',
      loading: 'Đang tải...', analyzing: 'Đang phân tích...', saved: 'Đã lưu', error: 'Lỗi',
      try_now: 'Thử ngay (không cần đăng ký)', ask_button: 'Hỏi', photo: 'Ảnh',
      register_free: 'Đăng ký miễn phí', retry: 'Thử lại',
    },
    ar: {
      app_name: 'مذكرات الصحة', app_subtitle: '~ دعم تعافي الأمراض المزمنة ~',
      dashboard: 'الرئيسية', record: 'تسجيل', actions: 'إجراءات', research: 'أبحاث',
      ask_ai: 'استشارة', settings: 'الإعدادات', send: 'إرسال', logout: 'تسجيل الخروج',
      profile: 'الملف الشخصي', age: 'العمر', gender: 'الجنس', height: 'الطول', weight: 'الوزن',
      language: 'اللغة', login_google: 'تسجيل الدخول بجوجل', login: 'تسجيل الدخول',
      email: 'البريد الإلكتروني', password: 'كلمة المرور',
      loading: 'جارٍ التحميل...', analyzing: 'جارٍ التحليل...', saved: 'تم الحفظ', error: 'خطأ',
      try_now: 'جرّب الآن (بدون تسجيل)', ask_button: 'اسأل', photo: 'صورة',
      register_free: 'التسجيل مجاناً', retry: 'إعادة المحاولة',
    },
    hi: {
      app_name: 'स्वास्थ्य डायरी', app_subtitle: '~ पुरानी बीमारियों में सुधार का साथ ~',
      dashboard: 'होम', record: 'रिकॉर्ड', actions: 'कार्रवाई', research: 'शोध',
      ask_ai: 'परामर्श', settings: 'सेटिंग्स', send: 'भेजें', logout: 'लॉग आउट',
      profile: 'प्रोफ़ाइल', age: 'आयु', gender: 'लिंग', height: 'ऊँचाई', weight: 'वज़न',
      language: 'भाषा', login_google: 'Google से लॉग इन', login: 'लॉग इन',
      email: 'ईमेल', password: 'पासवर्ड',
      loading: 'लोड हो रहा है...', analyzing: 'विश्लेषण हो रहा है...', saved: 'सहेजा गया', error: 'त्रुटि',
      try_now: 'अभी आज़माएँ (पंजीकरण अनावश्यक)', ask_button: 'पूछें', photo: 'फ़ोटो',
      register_free: 'मुफ़्त रजिस्टर करें', retry: 'पुनः प्रयास',
    },
  },

  t(key) {
    return this.translations[this.currentLang]?.[key]
      || this.translations['ja']?.[key]
      || key;
  },

  setLang(lang) {
    this.currentLang = lang;
    localStorage.setItem('cc_language', lang);
    store.set('userProfile', { ...(store.get('userProfile') || {}), language: lang });
  },

  init() {
    const profile = store.get('userProfile');
    const stored = localStorage.getItem('cc_language');
    this.currentLang = profile?.language || stored || 'ja';
  },

  // Post-render DOM translation: walks the rendered page and replaces
  // known Japanese strings with the user's selected language. This
  // avoids rewriting every hardcoded template in pages.js (~4000 lines).
  translatePage() {
    if (this.currentLang === 'ja') return;
    const dict = this.translations[this.currentLang];
    if (!dict) return;
    const ja = this.translations.ja;

    // Build reverse map: Japanese text → i18n key
    if (!this._reverseMap || this._reverseMapLang !== this.currentLang) {
      this._reverseMap = new Map();
      for (const [key, jaText] of Object.entries(ja)) {
        const translated = dict[key];
        if (translated && translated !== jaText) {
          this._reverseMap.set(jaText, translated);
        }
      }
      this._reverseMapLang = this.currentLang;
    }
    const map = this._reverseMap;
    if (map.size === 0) return;

    // Walk text nodes in the entire document body (not just page-content)
    // so sidebar navigation, top bar, and footer also get translated.
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null
    );
    let node;
    while (node = walker.nextNode()) {
      const original = node.textContent.trim();
      if (!original) continue;
      // Exact match
      if (map.has(original)) {
        node.textContent = node.textContent.replace(original, map.get(original));
        continue;
      }
      // Partial match for longer strings containing known text
      for (const [ja, tr] of map) {
        if (ja.length >= 2 && node.textContent.includes(ja)) {
          node.textContent = node.textContent.replace(ja, tr);
        }
      }
    }

    // Translate attributes: placeholder, title, aria-label, value (buttons)
    const el = document.body;
    el.querySelectorAll('[placeholder],[title],[aria-label]').forEach(function(e) {
      ['placeholder', 'title', 'aria-label'].forEach(function(attr) {
        var val = e.getAttribute(attr);
        if (val && map.has(val.trim())) {
          e.setAttribute(attr, map.get(val.trim()));
        }
      });
    });
    // Translate button/submit values
    el.querySelectorAll('button, input[type="submit"]').forEach(function(btn) {
      var txt = btn.textContent.trim();
      if (map.has(txt)) btn.textContent = map.get(txt);
    });
    // Translate select option text
    el.querySelectorAll('option').forEach(function(opt) {
      var txt = opt.textContent.trim();
      if (map.has(txt)) opt.textContent = map.get(txt);
    });

    // Update document title and html lang
    document.documentElement.lang = this.currentLang;
    if (dict.app_name) document.title = document.title.replace(ja.app_name, dict.app_name);
  }
};

document.addEventListener('DOMContentLoaded', () => i18n.init());
