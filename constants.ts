

import { DeedDefinition, SinDefinition, QadaCounts, WorkoutDefinition, DeedLibraryItem, ActiveDeed } from './types';

// ─── کتابخانه جامع اعمال ───────────────────────────────────────────────────

export const DEED_LIBRARY: DeedLibraryItem[] = [

  // ─── نمازهای واجب (پیش‌فرض و قفل شده) ───────────────────────────────────
  { id: 'prayer_fajr',    title: 'نماز صبح (اول وقت)',   subtitle: 'نماز واجب صبحگاه', category: 'prayers_obligatory', defaultType: 'binary', defaultPoints: 30, isBuiltIn: true },
  { id: 'prayer_dhuhr',   title: 'نماز ظهر و عصر (اول وقت)', subtitle: 'دو نماز واجب ظهر', category: 'prayers_obligatory', defaultType: 'binary', defaultPoints: 35, isBuiltIn: true },
  { id: 'prayer_maghrib', title: 'نماز مغرب و عشا (اول وقت)', subtitle: 'دو نماز واجب شامگاه', category: 'prayers_obligatory', defaultType: 'binary', defaultPoints: 35, isBuiltIn: true },

  // ─── نمازهای مستحب ───────────────────────────────────────────────────────
  { id: 'prayer_night',         title: 'نماز شب (تهجد)',         subtitle: 'نافله شب ۸ رکعت + وتر', category: 'prayers_optional', defaultType: 'binary', defaultPoints: 25, isBuiltIn: true },
  { id: 'prayer_nafila_fajr',   title: 'نافله صبح',              subtitle: '۲ رکعت قبل از نماز صبح', category: 'prayers_optional', defaultType: 'binary', defaultPoints: 10, isBuiltIn: true },
  { id: 'prayer_nafila_dhuhr',  title: 'نافله ظهر',              subtitle: '۸ رکعت قبل از نماز ظهر', category: 'prayers_optional', defaultType: 'binary', defaultPoints: 10, isBuiltIn: true },
  { id: 'prayer_nafila_asr',    title: 'نافله عصر',              subtitle: '۸ رکعت قبل از نماز عصر', category: 'prayers_optional', defaultType: 'binary', defaultPoints: 10, isBuiltIn: true },
  { id: 'prayer_nafila_maghrib','title': 'نافله مغرب',           subtitle: '۴ رکعت بعد از مغرب', category: 'prayers_optional', defaultType: 'binary', defaultPoints: 10, isBuiltIn: true },
  { id: 'prayer_jafar',         title: 'نماز جعفر طیار',        subtitle: '۴ رکعت با تسبیحات خاص', category: 'prayers_optional', defaultType: 'binary', defaultPoints: 15, isBuiltIn: true },
  { id: 'prayer_ghufaylah',     title: 'نماز غفیله',             subtitle: 'بین مغرب و عشا', category: 'prayers_optional', defaultType: 'binary', defaultPoints: 10, isBuiltIn: true },
  { id: 'prayer_imam_zaman',    title: 'نماز امام زمان (عج)',    subtitle: '۲ رکعت هدیه به حضرت', category: 'prayers_optional', defaultType: 'binary', defaultPoints: 15, isBuiltIn: true },
  { id: 'prayer_shab_jumuah',   title: 'نماز شب جمعه',          subtitle: 'نافله خاص شب جمعه', category: 'prayers_optional', defaultType: 'binary', defaultPoints: 15, isBuiltIn: true },

  // ─── ادعیه و اذکار ───────────────────────────────────────────────────────
  { id: 'dua_kumayl',     title: 'دعای کمیل',       subtitle: 'هر شب جمعه', category: 'duas', defaultType: 'binary', defaultPoints: 20, isBuiltIn: true },
  { id: 'dua_tawassul',   title: 'دعای توسل',       subtitle: 'توسل به ائمه (ع)', category: 'duas', defaultType: 'binary', defaultPoints: 15, isBuiltIn: true },
  { id: 'dua_nudba',      title: 'دعای ندبه',       subtitle: 'هر صبح جمعه', category: 'duas', defaultType: 'binary', defaultPoints: 15, isBuiltIn: true },
  { id: 'dua_ahd',        title: 'دعای عهد',        subtitle: 'هر صبح ۴۰ روز', category: 'duas', defaultType: 'binary', defaultPoints: 15, isBuiltIn: true },
  { id: 'dua_sabah',      title: 'دعای صباح',       subtitle: 'دعای امام علی (ع) در صبح', category: 'duas', defaultType: 'binary', defaultPoints: 10, isBuiltIn: true },
  { id: 'dua_faraj',      title: 'دعای فرج',        subtitle: 'یا الله یا رحمن...', category: 'duas', defaultType: 'binary', defaultPoints: 5, isBuiltIn: true },
  { id: 'dua_mashlool',   title: 'دعای مشلول',      subtitle: 'دعای طولانی برای شفا', category: 'duas', defaultType: 'binary', defaultPoints: 20, isBuiltIn: true },
  { id: 'dua_jawshan',    title: 'دعای جوشن کبیر',  subtitle: '۱۰۰۰ اسم خداوند', category: 'duas', defaultType: 'binary', defaultPoints: 25, isBuiltIn: true },
  { id: 'dhikr_salawat',  title: '۱۰۰ صلوات',       subtitle: 'اللهم صل علی محمد...', category: 'duas', defaultType: 'binary', defaultPoints: 10, isBuiltIn: true },
  { id: 'dhikr_istighfar',title: '۷۰ استغفار',      subtitle: 'استغفرالله ربی و اتوب الیه', category: 'duas', defaultType: 'binary', defaultPoints: 10, isBuiltIn: true },
  { id: 'dhikr_tasbih',   title: 'تسبیح حضرت زهرا (س)', subtitle: '۳۴ الله اکبر، ۳۳ الحمدلله، ۳۳ سبحان الله', category: 'duas', defaultType: 'binary', defaultPoints: 10, isBuiltIn: true },
  { id: 'dhikr_morning',  title: 'اذکار صبح و شام', subtitle: 'ذکرهای مستحب سحر و عصر', category: 'duas', defaultType: 'binary', defaultPoints: 10, isBuiltIn: true },
  { id: 'dua_hadith_kisa',title: 'حدیث کساء',       subtitle: 'قرائت حدیث کساء', category: 'duas', defaultType: 'binary', defaultPoints: 15, isBuiltIn: true },

  // ─── سوره‌های قرآن ───────────────────────────────────────────────────────
  { id: 'quran_yasin',      title: 'سوره یس',       subtitle: 'قلب قرآن', category: 'quran', defaultType: 'binary', defaultPoints: 15, isBuiltIn: true },
  { id: 'quran_waqiah',     title: 'سوره واقعه',    subtitle: 'دافع فقر', category: 'quran', defaultType: 'binary', defaultPoints: 10, isBuiltIn: true },
  { id: 'quran_mulk',       title: 'سوره ملک',      subtitle: 'شفاعت در قبر', category: 'quran', defaultType: 'binary', defaultPoints: 10, isBuiltIn: true },
  { id: 'quran_fath',       title: 'سوره فتح',      subtitle: '۱۰ ثواب هر آیه', category: 'quran', defaultType: 'binary', defaultPoints: 10, isBuiltIn: true },
  { id: 'quran_dhariyat',   title: 'سوره ذاریات',   subtitle: 'روزی فراوان', category: 'quran', defaultType: 'binary', defaultPoints: 10, isBuiltIn: true },
  { id: 'quran_kahf',       title: 'سوره کهف',      subtitle: 'روز جمعه', category: 'quran', defaultType: 'binary', defaultPoints: 10, isBuiltIn: true },
  { id: 'quran_al_imran',   title: 'آل عمران ۱-۱۸', subtitle: 'آیات ابتدایی سوره', category: 'quran', defaultType: 'binary', defaultPoints: 10, isBuiltIn: true },
  { id: 'quran_ikhlas',     title: 'سوره توحید (۱۰ بار)', subtitle: 'ثواب ختم قرآن', category: 'quran', defaultType: 'binary', defaultPoints: 5, isBuiltIn: true },
  { id: 'quran_page',       title: 'قرائت قرآن (روزانه)', subtitle: 'حداقل یک صفحه', category: 'quran', defaultType: 'scalar', defaultPoints: 15, isBuiltIn: true },
  { id: 'quran_hifz',       title: 'حفظ قرآن',       subtitle: 'مراجعه به محفوظات یا حفظ جدید', category: 'quran', defaultType: 'scalar', defaultPoints: 15, isBuiltIn: true },

  // ─── زیارات ──────────────────────────────────────────────────────────────
  { id: 'ziyarat_ashura',      title: 'زیارت عاشورا',        subtitle: 'زیارت امام حسین (ع)', category: 'ziyarat', defaultType: 'binary', defaultPoints: 20, isBuiltIn: true },
  { id: 'ziyarat_ale_yasin',   title: 'زیارت آل یاسین',      subtitle: 'زیارت امام زمان (عج)', category: 'ziyarat', defaultType: 'binary', defaultPoints: 15, isBuiltIn: true },
  { id: 'ziyarat_amin_allah',  title: 'زیارت امین‌الله',      subtitle: 'زیارت عمومی ائمه', category: 'ziyarat', defaultType: 'binary', defaultPoints: 15, isBuiltIn: true },
  { id: 'ziyarat_warith',      title: 'زیارت وارث',           subtitle: 'زیارت امام حسین (ع)', category: 'ziyarat', defaultType: 'binary', defaultPoints: 15, isBuiltIn: true },
  { id: 'ziyarat_imam_reza',   title: 'زیارت امام رضا (ع)',   subtitle: 'زیارت مخصوص حضرت', category: 'ziyarat', defaultType: 'binary', defaultPoints: 10, isBuiltIn: true },
  { id: 'ziyarat_jumuah',      title: 'زیارت جامعه کبیره',   subtitle: 'زیارت جامع الائمه', category: 'ziyarat', defaultType: 'binary', defaultPoints: 20, isBuiltIn: true },

  // ─── اعمال طلایی ─────────────────────────────────────────────────────────
  { id: 'golden_father_hand',  title: 'بوسیدن دست پدر',      subtitle: 'احترام به والدین', category: 'golden', defaultType: 'binary', defaultPoints: 20, isBuiltIn: true },
  { id: 'golden_mother_hand',  title: 'بوسیدن دست مادر',     subtitle: 'احترام به والدین', category: 'golden', defaultType: 'binary', defaultPoints: 20, isBuiltIn: true },
  { id: 'golden_parents',      title: 'خوشحال کردن پدر و مادر', subtitle: 'برترین عبادات', category: 'golden', defaultType: 'binary', defaultPoints: 15, isBuiltIn: true },
  { id: 'golden_salawat',      title: '۱۰۰ صلوات',            subtitle: 'نزدیک‌ترین راه به پیامبر', category: 'golden', defaultType: 'binary', defaultPoints: 10, isBuiltIn: true },
  { id: 'golden_others',       title: 'خوشحال کردن مومن',     subtitle: 'شادی مومن عبادت است', category: 'golden', defaultType: 'binary', defaultPoints: 10, isBuiltIn: true },
  { id: 'golden_sadaqah',      title: 'صدقه مالی',             subtitle: 'کم یا زیاد', category: 'golden', defaultType: 'binary', defaultPoints: 10, isBuiltIn: true },
  { id: 'golden_ehsan',        title: 'احسان و کار خیر',      subtitle: 'هر کار خیر برای دیگران', category: 'golden', defaultType: 'binary', defaultPoints: 10, isBuiltIn: true },

  // ─── مراقبه‌های اخلاقی ───────────────────────────────────────────────────
  { id: 'ethical_gaze',       title: 'کنترل نگاه',            subtitle: 'نگاه نکردن به نامحرم', category: 'ethical', defaultType: 'scalar', defaultPoints: 20, isBuiltIn: true },
  { id: 'ethical_truth',      title: 'صداقت (نگفتن دروغ)',   subtitle: 'در تمام گفتارها', category: 'ethical', defaultType: 'scalar', defaultPoints: 15, isBuiltIn: true },
  { id: 'ethical_sleep',      title: 'خواب سر وقت',           subtitle: 'قبل از نیمه شب', category: 'ethical', defaultType: 'scalar', defaultPoints: 10, isBuiltIn: true },
  { id: 'ethical_anger',      title: 'کنترل خشم',             subtitle: 'مدیریت عصبانیت', category: 'ethical', defaultType: 'scalar', defaultPoints: 15, isBuiltIn: true },
  { id: 'ethical_patience',   title: 'صبر و بردباری',         subtitle: 'در برابر مشکلات', category: 'ethical', defaultType: 'scalar', defaultPoints: 15, isBuiltIn: true },
  { id: 'ethical_gratitude',  title: 'شکرگزاری',              subtitle: 'سپاس از نعمات خدا', category: 'ethical', defaultType: 'scalar', defaultPoints: 10, isBuiltIn: true },
  { id: 'ethical_tawakkul',   title: 'توکل و رضا',            subtitle: 'رضایت از مشیت الهی', category: 'ethical', defaultType: 'scalar', defaultPoints: 10, isBuiltIn: true },
  { id: 'ethical_tongue',     title: 'نگهداری زبان',          subtitle: 'پرهیز از غیبت و بیهوده‌گویی', category: 'ethical', defaultType: 'scalar', defaultPoints: 15, isBuiltIn: true },
  { id: 'ethical_phone',      title: 'کنترل استفاده از موبایل', subtitle: 'بدون وقت تلف', category: 'ethical', defaultType: 'scalar', defaultPoints: 10, isBuiltIn: true },
  { id: 'ethical_muhasabah',  title: 'محاسبه نفس شبانه',      subtitle: 'مرور اعمال روز قبل از خواب', category: 'ethical', defaultType: 'binary', defaultPoints: 15, isBuiltIn: true },

  // ─── کارهای مستحب و خیر ─────────────────────────────────────────────────
  { id: 'charity_help',       title: 'کمک به دیگران',         subtitle: 'هر نوع یاری رسانی', category: 'charity', defaultType: 'binary', defaultPoints: 10, isBuiltIn: true },
  { id: 'charity_sele_rahem', title: 'صله رحم',               subtitle: 'دیدار با خویشاوندان', category: 'charity', defaultType: 'binary', defaultPoints: 10, isBuiltIn: true },
  { id: 'charity_visit_sick', title: 'عیادت بیمار',           subtitle: 'دیدن بیماران', category: 'charity', defaultType: 'binary', defaultPoints: 10, isBuiltIn: true },
  { id: 'charity_neighbor',   title: 'رسیدگی به همسایه',     subtitle: 'توجه به همسایگان', category: 'charity', defaultType: 'binary', defaultPoints: 10, isBuiltIn: true },
  { id: 'charity_fast_mon',   title: 'روزه مستحبی دوشنبه',   subtitle: 'روزه روز دوشنبه', category: 'charity', defaultType: 'binary', defaultPoints: 15, isBuiltIn: true },
  { id: 'charity_fast_thu',   title: 'روزه مستحبی پنجشنبه', subtitle: 'روزه روز پنجشنبه', category: 'charity', defaultType: 'binary', defaultPoints: 15, isBuiltIn: true },

  // ─── علم و خودسازی ───────────────────────────────────────────────────────
  { id: 'knowledge_dars',     title: 'مطالعه دینی',           subtitle: 'خواندن کتاب اخلاق یا فقه', category: 'knowledge', defaultType: 'scalar', defaultPoints: 15, isBuiltIn: true },
  { id: 'knowledge_podcast',  title: 'شنیدن درس دینی',        subtitle: 'پادکست یا سخنرانی عالم', category: 'knowledge', defaultType: 'binary', defaultPoints: 10, isBuiltIn: true },
  { id: 'knowledge_writing',  title: 'نوشتن درس‌آموخته',      subtitle: 'ثبت نکات آموخته شده', category: 'knowledge', defaultType: 'binary', defaultPoints: 10, isBuiltIn: true },
  { id: 'knowledge_tadabbur', title: 'تدبر در قرآن',          subtitle: 'فهمیدن معنای آیات', category: 'knowledge', defaultType: 'scalar', defaultPoints: 15, isBuiltIn: true },

  // ─── ریاضت بدنی ──────────────────────────────────────────────────────────
  { id: 'physical_exercise',  title: 'ورزش و تحرک',           subtitle: 'حداقل ۲۰ دقیقه', category: 'physical', defaultType: 'scalar', defaultPoints: 10, isBuiltIn: true },
  { id: 'physical_eat',       title: 'کم‌خوری و پرهیز',       subtitle: 'نخوردن بیش از حد', category: 'physical', defaultType: 'scalar', defaultPoints: 10, isBuiltIn: true },
  { id: 'physical_early',     title: 'بیداری سحر',            subtitle: 'بیدار شدن قبل از اذان صبح', category: 'physical', defaultType: 'binary', defaultPoints: 15, isBuiltIn: true },
  { id: 'physical_walk',      title: 'پیاده‌روی',              subtitle: 'قدم زدن روزانه', category: 'physical', defaultType: 'binary', defaultPoints: 5, isBuiltIn: true },
];

// اعمال پیش‌فرض که همه کاربران با آن شروع می‌کنند
export const DEFAULT_ACTIVE_DEEDS: ActiveDeed[] = [
  // نمازهای واجب — قفل شده
  { id: 'prayer_fajr',    libraryId: 'prayer_fajr',    title: 'نماز صبح (اول وقت)',        category: 'prayers_obligatory', type: 'binary', points: 30, isLocked: true, sortOrder: 0 },
  { id: 'prayer_dhuhr',   libraryId: 'prayer_dhuhr',   title: 'نماز ظهر و عصر (اول وقت)', category: 'prayers_obligatory', type: 'binary', points: 35, isLocked: true, sortOrder: 1 },
  { id: 'prayer_maghrib', libraryId: 'prayer_maghrib', title: 'نماز مغرب و عشا (اول وقت)', category: 'prayers_obligatory', type: 'binary', points: 35, isLocked: true, sortOrder: 2 },
];

// ─── تعاریف قدیمی (برای backward compatibility) ──────────────────────────

export const DEEDS: DeedDefinition[] = [
  { id: 'ziyarat_ashura', title: 'زیارت عاشورا', type: 'binary' },
  { id: 'ziyarat_ale_yasin', title: 'زیارت آل یاسین', type: 'binary' },
  { id: 'surah_fath', title: 'سوره فتح', type: 'binary' },
  { id: 'surah_dhariyat', title: 'سوره ذاریات', type: 'binary' },
  { id: 'surah_waqiah', title: 'سوره واقعه', type: 'binary' },
  { id: 'surah_yasin', title: 'سوره یس', type: 'binary' },
  { id: 'gaze_control', title: 'کنترل نگاه (نگاه نکردن به نامحرم)', type: 'scalar' },
  { id: 'truthfulness', title: 'صداقت (نگفتن دروغ)', type: 'scalar' },
  { id: 'sleep_time', title: 'خوابیدن سر زمان مناسب', type: 'scalar' },
  { id: 'prayer_fajr', title: 'نماز اول وقت صبح', type: 'prayer' },
  { id: 'prayer_dhuhr', title: 'نماز اول وقت ظهر', type: 'prayer' },
  { id: 'prayer_maghrib', title: 'نماز اول وقت شب', type: 'prayer' },
  { id: 'golden_night_prayer', title: 'نماز شب', type: 'golden' },
  { id: 'golden_father_hand', title: 'بوسیدن دست پدر', type: 'golden' },
  { id: 'golden_mother_hand', title: 'بوسیدن دست مادر', type: 'golden' },
  { id: 'golden_salawat', title: '۱۰۰ تا صلوات', type: 'golden' },
  { id: 'golden_parents', title: 'خوشحال کردن پدر و مادر', type: 'golden' },
  { id: 'golden_others', title: 'خوشحال کردن دیگران', type: 'golden' },
];

export const WORKOUTS: WorkoutDefinition[] = [
    { id: 'pushups', title: 'شنا سوئدی', unit: 'تعداد' },
    { id: 'situps', title: 'دراز و نشست', unit: 'تعداد' },
    { id: 'squats', title: 'اسکات پا', unit: 'تعداد' },
    { id: 'plank', title: 'پلانک', unit: 'ثانیه' },
    { id: 'running', title: 'دویدن', unit: 'دقیقه' },
];

export const SINS_LIST: SinDefinition[] = [
  // --- گناهان زبان ---
  { id: 'ghibat', title: 'غیبت (پشت سر دیگران حرف زدن)' },
  { id: 'dorough', title: 'دروغ (جدی یا شوخی)' },
  { id: 'tohmat', title: 'تهمت و افترا' },
  { id: 'masakhara', title: 'مسخره کردن و استهزاء دیگران' },
  { id: 'fahashi', title: 'فحاشی، بددهانی و ناسزا' },
  { id: 'sokhan_chini', title: 'سخن‌چینی و دو بهم زنی' },
  { id: 'bad_gholi', title: 'بدقولی و خلف وعده' },
  { id: 'shookhi_nabaja', title: 'شوخی نابجا و زننده با نامحرم یا مؤمن' },
  { id: 'mojadele', title: 'مجادله، لجبازی و جر و بحث بیهوده' },
  { id: 'ayb_juyi', title: 'عیب‌جویی و فاش کردن عیوب دیگران' },
  { id: 'raz_dari', title: 'فاش کردن راز دیگران' },
  { id: 'kaneh_jouyi', title: 'کنجکاوی و تجسس در امور دیگران' },
  { id: 'ghasam_dorough', title: 'قسم دروغ خوردن' },
  { id: 'shahadat_dorough', title: 'شهادت ناحق و دروغ' },
  { id: 'minnat', title: 'منت گذاشتن بعد از کار خیر' },
  { id: 'zakhm_zaban', title: 'زخم زبان و نیش زدن' },
  { id: 'tamalloq', title: 'تملق و چاپلوسی بیجا' },
  { id: 'fash_kardan_sir', title: 'افشای سرّ خود (بازگو کردن گناهان گذشته)' },
  { id: 'shaye_parakani', title: 'شایعه‌پراکنی بدون تحقیق' },
  { id: 'mora_a', title: 'مراء (بحث کردن برای اظهار فضل)' },

  // --- گناهان چشم و گوش و ارتباطات ---
  { id: 'negah_haram', title: 'نگاه به حرام و نامحرم (حضوری یا مجازی)' },
  { id: 'goushe_haram', title: 'گوش دادن به موسیقی حرام و غنا' },
  { id: 'goushe_ghibat', title: 'گوش دادن به غیبت و سکوت در برابر آن' },
  { id: 'negah_tahghir', title: 'نگاه تحقیرآمیز به دیگران' },
  { id: 'khelvat_namahram', title: 'خلوت کردن با نامحرم' },
  { id: 'dast_dadan_namahram', title: 'دست دادن یا تماس بدنی با نامحرم' },
  { id: 'tabarroh', title: 'تبرّج و خودنمایی برای نامحرم' },
  { id: 'shookhi_ba_namahram', title: 'شوخی و خندیدن با نامحرم' },

  // --- رذایل اخلاقی و قلبی ---
  { id: 'khasm', title: 'خشم، عصبانیت بیجا و پرخاشگری' },
  { id: 'hasad', title: 'حسادت (آرزوی زوال نعمت دیگران)' },
  { id: 'takabbor', title: 'تکبر، غرور و خودبرتربینی' },
  { id: 'riya', title: 'ریا و خودنمایی در عبادات یا کار خیر' },
  { id: 'ojb', title: 'عُجب (خودپسندی و راضی بودن از خود)' },
  { id: 'kineh', title: 'کینه و دشمنی با مؤمن' },
  { id: 'sue_zan', title: 'سوء ظن و بدبینی به دیگران' },
  { id: 'qezavat', title: 'قضاوت زود و نابجا' },
  { id: 'hubb_donya', title: 'حب دنیا و دلبستگی افراطی' },
  { id: 'tama', title: 'طمع و چشم‌داشت به مال مردم' },
  { id: 'naomidi', title: 'ناامیدی از رحمت خدا (یأس)' },
  { id: 'nasopasi', title: 'ناسپاسی و کفران نعمت' },
  { id: 'bad_akhlaghi', title: 'بد اخلاقی و تندخویی با خانواده یا مردم' },
  { id: 'shamatat', title: 'شماتت (شادی از گرفتاری دیگران)' },
  { id: 'hars', title: 'حرص (زیاده‌خواهی در مال دنیا)' },
  { id: 'hubb_maqam', title: 'حب مقام و ریاست‌طلبی' },
  { id: 'nifaq', title: 'نفاق و دورویی' },
  { id: 'bad_goman_be_khoda', title: 'بدگمانی به وعده‌های خدا' },

  // --- حق الناس و رفتار اجتماعی ---
  { id: 'azar_waledain', title: 'آزار پدر و مادر و بی‌احترامی (عاق والدین)' },
  { id: 'hagh_nas_mali', title: 'مدیونی مالی (عدم پرداخت بدهی)' },
  { id: 'hagh_nas_aberoo', title: 'ریختن آبروی مومن' },
  { id: 'azar_hamsaye', title: 'آزار همسایه' },
  { id: 'ghat_rahem', title: 'قطع رحم (قهر با خویشاوندان)' },
  { id: 'komak_be_zalem', title: 'کمک به ظالم یا تایید کار او' },
  { id: 'bi_tafavoti', title: 'بی‌تفاوت بودن نسبت به امر به معروف' },
  { id: 'khianat_amanat', title: 'خیانت در امانت (مالی یا غیرمالی)' },
  { id: 'kam_foroushi', title: 'کم‌فروشی و غش در معامله' },
  { id: 'gran_foroushi', title: 'گران‌فروشی بیجا' },
  { id: 'reshve', title: 'رشوه دادن یا رشوه گرفتن' },
  { id: 'beytolmal', title: 'استفاده شخصی از بیت‌المال یا اموال عمومی' },
  { id: 'sad_mabar', title: 'سد معبر و ایجاد مزاحمت برای عابران' },
  { id: 'ghanoon_shekani', title: 'قانون‌گریزی (مثل تخلفات رانندگی)' },
  { id: 'azar_heyvan', title: 'آزار حیوانات' },
  { id: 'tahghir_momen', title: 'تحقیر و کوچک شمردن مؤمن' },

  // --- کاهلی و رفتار فردی ---
  { id: 'israf', title: 'اسراف و زیاده‌روی (در خوراک، پوشاک، آب و...)' },
  { id: 'talaf_vaqt', title: 'تلف کردن وقت در فضای مجازی یا بیهودگی' },
  { id: 'tanbaly_namaz', title: 'سبک شمردن نماز یا تاخیر بدون عذر' },
  { id: 'porkhori', title: 'پرخوری و شکم‌پرستی' },
  { id: 'ghaflet_yad_khoda', title: 'غفلت از یاد خدا' },
  { id: 'ozr_tarashi', title: 'توجیه گناه و بهانه‌تراشی' },
  { id: 'shekan_ahd_khoda', title: 'شکستن عهد با خدا (توبه شکنی)' },
  { id: 'tabzir', title: 'تبذیر (ریخت و پاش بیجا)' },
  { id: 'tark_talom', title: 'ترک یادگیری مسائل شرعی مورد نیاز' },
  { id: 'takhir_ghosl', title: 'تاخیر انداختن غسل واجب' },
  { id: 'nejasat_masjed', title: 'نجس کردن مسجد یا اماکن مقدس' },
  { id: 'cheshm_ham_cheshmi', title: 'چشم و هم‌چشمی و رقابت ناسالم' },
  { id: 'tajammol', title: 'تجمل‌گرایی افراطی' },
];

export const APP_STORAGE_KEY = 'muhasabah_app_data';
export const APP_SETTINGS_KEY = 'muhasabah_app_settings';
export const APP_QADA_KEY = 'muhasabah_qada_data';
export const APP_WORKOUT_PR_KEY = 'muhasabah_workout_pr';
export const APP_WORKOUT_SETTINGS_KEY = 'muhasabah_workout_settings';
export const APP_CHALLENGES_KEY = 'muhasabah_challenges';

export const QADA_ITEMS: { key: keyof QadaCounts; title: string }[] = [
    { key: 'fajr', title: 'نماز صبح' },
    { key: 'dhuhr', title: 'نماز ظهر' },
    { key: 'asr', title: 'نماز عصر' },
    { key: 'maghrib', title: 'نماز مغرب' },
    { key: 'isha', title: 'نماز عشا' },
    { key: 'ayat', title: 'نماز آیات' },
    { key: 'fasting', title: 'روزه' },
];

// اطلاعات نمایشی هر دسته‌بندی
export const CATEGORY_META: Record<string, { label: string; emoji: string; color: string; bgColor: string; borderColor: string }> = {
  prayers_obligatory: { label: 'نمازهای واجب',     emoji: '🕌', color: 'text-emerald-700 dark:text-emerald-300', bgColor: 'bg-emerald-50 dark:bg-emerald-900/30', borderColor: 'border-emerald-200 dark:border-emerald-700' },
  prayers_optional:   { label: 'نمازهای مستحب',    emoji: '🌙', color: 'text-teal-700 dark:text-teal-300',     bgColor: 'bg-teal-50 dark:bg-teal-900/30',         borderColor: 'border-teal-200 dark:border-teal-700'   },
  duas:               { label: 'ادعیه و اذکار',     emoji: '📿', color: 'text-violet-700 dark:text-violet-300', bgColor: 'bg-violet-50 dark:bg-violet-900/30',     borderColor: 'border-violet-200 dark:border-violet-700' },
  quran:              { label: 'قرآن کریم',          emoji: '📖', color: 'text-blue-700 dark:text-blue-300',     bgColor: 'bg-blue-50 dark:bg-blue-900/30',         borderColor: 'border-blue-200 dark:border-blue-700'   },
  ziyarat:            { label: 'زیارات',             emoji: '🌿', color: 'text-cyan-700 dark:text-cyan-300',     bgColor: 'bg-cyan-50 dark:bg-cyan-900/30',         borderColor: 'border-cyan-200 dark:border-cyan-700'   },
  golden:             { label: 'اعمال طلایی',        emoji: '⭐', color: 'text-amber-700 dark:text-amber-300',   bgColor: 'bg-amber-50 dark:bg-amber-900/30',       borderColor: 'border-amber-200 dark:border-amber-700' },
  ethical:            { label: 'مراقبه‌های اخلاقی', emoji: '🌱', color: 'text-lime-700 dark:text-lime-300',     bgColor: 'bg-lime-50 dark:bg-lime-900/30',         borderColor: 'border-lime-200 dark:border-lime-700'   },
  charity:            { label: 'کارهای خیر',         emoji: '✋', color: 'text-rose-700 dark:text-rose-300',     bgColor: 'bg-rose-50 dark:bg-rose-900/30',         borderColor: 'border-rose-200 dark:border-rose-700'   },
  knowledge:          { label: 'علم و خودسازی',      emoji: '📚', color: 'text-indigo-700 dark:text-indigo-300', bgColor: 'bg-indigo-50 dark:bg-indigo-900/30',     borderColor: 'border-indigo-200 dark:border-indigo-700' },
  physical:           { label: 'ریاضت بدنی',         emoji: '🏃', color: 'text-orange-700 dark:text-orange-300', bgColor: 'bg-orange-50 dark:bg-orange-900/30',     borderColor: 'border-orange-200 dark:border-orange-700' },
  sins:               { label: 'گناهان',             emoji: '⚠️', color: 'text-red-700 dark:text-red-300',       bgColor: 'bg-red-50 dark:bg-red-900/30',           borderColor: 'border-red-200 dark:border-red-700'     },
  custom:             { label: 'سفارشی',             emoji: '✏️', color: 'text-gray-700 dark:text-gray-300',     bgColor: 'bg-gray-50 dark:bg-gray-900/30',         borderColor: 'border-gray-200 dark:border-gray-700'   },
};

export const LIBRARY_CATEGORY_ORDER = [
  'prayers_optional', 'duas', 'quran', 'ziyarat', 'golden', 'ethical', 'charity', 'knowledge', 'physical'
];

// Helper to get today's date in YYYY-MM-DD format relative to local time
export const getTodayStr = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// --- Persian Digit Helpers ---

export const toPersianDigits = (n: number | string | undefined): string => {
    if (n === undefined || n === null) return '';
    const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return n.toString().replace(/\d/g, x => farsiDigits[parseInt(x)]);
};

export const toEnglishDigits = (str: string): string => {
    const persianNumbers = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
    const arabicNumbers = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /۸/g, /٩/g];
    
    if (typeof str !== 'string') return str;
    
    let result = str;
    for (let i = 0; i < 10; i++) {
        result = result.replace(persianNumbers[i], i.toString()).replace(arabicNumbers[i], i.toString());
    }
    return result;
};

export const toShamsiDate = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(date);
    } catch (e) {
        return dateStr;
    }
};
