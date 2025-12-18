


import { DeedDefinition, SinDefinition, QadaCounts, WorkoutDefinition } from './types';

export const DEEDS: DeedDefinition[] = [
  // Binary Deeds (0 or 100)
  { id: 'ziyarat_ashura', title: 'زیارت عاشورا', type: 'binary' },
  { id: 'ziyarat_ale_yasin', title: 'زیارت آل یاسین', type: 'binary' },
  { id: 'surah_fath', title: 'سوره فتح', type: 'binary' },
  { id: 'surah_dhariyat', title: 'سوره ذاریات', type: 'binary' },
  { id: 'surah_waqiah', title: 'سوره واقعه', type: 'binary' },
  { id: 'surah_yasin', title: 'سوره یس', type: 'binary' },
  
  // Scalar Deeds (0 to 100)
  { id: 'gaze_control', title: 'کنترل نگاه (نگاه نکردن به نامحرم)', type: 'scalar' },
  { id: 'truthfulness', title: 'صداقت (نگفتن دروغ)', type: 'scalar' },
  { id: 'sleep_time', title: 'خوابیدن سر زمان مناسب', type: 'scalar' },

  // Prayer Deeds (Binary + Qada check)
  { id: 'prayer_fajr', title: 'نماز اول وقت صبح', type: 'prayer' },
  { id: 'prayer_dhuhr', title: 'نماز اول وقت ظهر', type: 'prayer' },
  { id: 'prayer_maghrib', title: 'نماز اول وقت شب', type: 'prayer' },

  // Golden Deeds (Bonus Score)
  { id: 'golden_night_prayer', title: 'نماز شب', type: 'golden' }, // +20, 2 Stars
  { id: 'golden_father_hand', title: 'بوسیدن دست پدر', type: 'golden' }, // +20, 2 Stars
  { id: 'golden_mother_hand', title: 'بوسیدن دست مادر', type: 'golden' }, // +20, 2 Stars
  { id: 'golden_salawat', title: '۱۰۰ صلوات برای سلامتی امام زمان (عج)', type: 'golden' }, // +10
  { id: 'golden_parents', title: 'خوشحال کردن پدر و مادر (غیر از دست‌بوسی)', type: 'golden' }, // +10
  { id: 'golden_others', title: 'خوشحال کردن دیگران', type: 'golden' }, // +10
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
