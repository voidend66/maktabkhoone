import { User, Book, LendingRequest, SchoolClass } from '../types';
import { BOY_AVATARS } from '../utils/avatars';

export const INITIAL_CLASSES: SchoolClass[] = [
  { id: 'c1', name: 'کلاس ۱-الف (پایه اول)', grade: 'پایه اول' },
  { id: 'c2', name: 'کلاس ۲-ب (پایه دوم)', grade: 'پایه دوم' },
  { id: 'c3', name: 'کلاس ۳-الف (پایه سوم)', grade: 'پایه سوم' },
  { id: 'c4', name: 'کلاس ۴-ج (پایه چهارم)', grade: 'پایه چهارم' },
  { id: 'c5', name: 'کلاس ۵-ب (پایه پنجم)', grade: 'پایه پنجم' },
  { id: 'c6', name: 'کلاس ۶-الف (پایه ششم)', grade: 'پایه ششم' },
  { id: 'c7', name: '۱۰ تجربی ۱', grade: 'پایه دهم' },
  { id: 'c8', name: '۱۱ ریاضی ۲', grade: 'پایه یازدهم' },
  { id: 'c9', name: 'خارج از مدرسه (مهمان / غیره)', grade: 'سایر / مهمان', isExternal: true }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'user_admin',
    name: 'پارسا فیض (مدیر سایت)',
    className: 'مدیریت سایت - مکتب خونه',
    phone: '09121112233',
    avatar: BOY_AVATARS[1].url,
    status: 'approved',
    role: 'admin',
    password: 'admin',
    rating: 5.0,
    ratingsCount: 30,
    booksContributedCount: 15,
    booksReadCount: 45,
    medals: [
      { id: 'm0', title: 'راهبر کتابخانه', icon: '👑', description: 'مدیریت و سرپرستی کتابخانه مدرسه', color: 'bg-amber-100 text-amber-800 border-amber-300' }
    ],
    joinedDate: '۱۴۰۲/۰۷/۰۱'
  },
  {
    id: 'user_1',
    name: 'حسن محمدی',
    className: '۱۰ تجربی ۱',
    phone: '09123456789',
    avatar: BOY_AVATARS[0].url,
    status: 'approved',
    role: 'student',
    password: '123',
    rating: 4.9,
    ratingsCount: 14,
    booksContributedCount: 6,
    booksReadCount: 11,
    medals: [
      { id: 'm1', title: 'کتاب‌خوان برتر', icon: '🥇', description: 'مطالعه بیش از ۱۰ جلد کتاب در ماه', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      { id: 'm2', title: 'امانت‌دار نمونه', icon: '⭐', description: 'پاسخگویی سریع و تحویل به موقع کتاب‌ها', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
      { id: 'm3', title: 'گنجینه کتاب', icon: '📚', description: 'اشتراک‌گذاری بیش از ۵ کتاب در کتابخانه', color: 'bg-blue-100 text-blue-800 border-blue-300' }
    ],
    joinedDate: '۱۴۰۲/۰۷/۱۵'
  },
  {
    id: 'user_2',
    name: 'احسان کریمی',
    className: '۱۱ ریاضی ۲',
    phone: '09198765432',
    avatar: BOY_AVATARS[2].url,
    status: 'approved',
    role: 'student',
    password: '123',
    rating: 4.7,
    ratingsCount: 9,
    booksContributedCount: 5,
    booksReadCount: 7,
    medals: [
      { id: 'm2', title: 'امانت‌دار نمونه', icon: '⭐', description: 'پاسخگویی سریع و تحویل به موقع کتاب‌ها', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
      { id: 'm4', title: 'منتقد فعال', icon: '✍️', description: 'ثبت بیش از ۵ دیدگاه ارزشمند برای کتاب‌ها', color: 'bg-purple-100 text-purple-800 border-purple-300' }
    ],
    joinedDate: '۱۴۰۲/۰۸/۰۱'
  },
  {
    id: 'user_3',
    name: 'سارا احمدی',
    className: 'کلاس ۳-الف (پایه سوم)',
    phone: '09351234567',
    avatar: BOY_AVATARS[3].url, // boy 4
    status: 'approved',
    role: 'student',
    password: '123',
    rating: 4.8,
    ratingsCount: 18,
    booksContributedCount: 7,
    booksReadCount: 14,
    medals: [
      { id: 'm1', title: 'کتاب‌خوان برتر', icon: '🥇', description: 'مطالعه بیش از ۱۰ جلد کتاب در ماه', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      { id: 'm3', title: 'گنجینه کتاب', icon: '📚', description: 'اشتراک‌گذاری بیش از ۵ کتاب در کتابخانه', color: 'bg-blue-100 text-blue-800 border-blue-300' }
    ],
    joinedDate: '۱۴۰۲/۰۷/۱۰'
  },
  {
    id: 'user_4',
    name: 'علی رضایی',
    className: 'خارج از مدرسه (مهمان / غیره)',
    phone: '09121119988',
    avatar: BOY_AVATARS[4].url, // boy 5
    status: 'approved',
    role: 'student',
    password: '123',
    rating: 4.6,
    ratingsCount: 8,
    booksContributedCount: 4,
    booksReadCount: 6,
    medals: [
      { id: 'm2', title: 'امانت‌دار نمونه', icon: '⭐', description: 'پاسخگویی سریع و تحویل به موقع کتاب‌ها', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' }
    ],
    joinedDate: '۱۴۰۲/۰۸/۱۵'
  },
  {
    id: 'user_5_pending',
    name: 'امیرحسین عباسی',
    className: 'کلاس ۵-ب (پایه پنجم)',
    phone: '09301239876',
    avatar: BOY_AVATARS[5].url, // astronaut
    status: 'pending',
    role: 'student',
    password: '123',
    rating: 5.0,
    ratingsCount: 0,
    booksContributedCount: 4,
    booksReadCount: 0,
    medals: [],
    joinedDate: '۱۴۰۳/۰۵/۱۰'
  }
];

export const INITIAL_BOOKS: Book[] = [
  {
    id: 'b1',
    title: 'شازده کوچولو',
    author: 'آنتوان دو سنت اگزوپری',
    ownerId: 'user_1',
    ownerName: 'حسن محمدی',
    ownerClass: '۱۰ تجربی ۱',
    ownerAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
    category: 'داستان و نوجوان',
    condition: 'عالی (نو)',
    description: 'داستان شازده کوچولو یکی از محبوب‌ترین کتاب‌های جهان درباره عشق، دوست داشتن و نگاه انسان به هستی.',
    status: 'available',
    rating: 4.9,
    reviewsCount: 5,
    addedDate: '۱۴۰۲/۰۷/۱۶',
    reviews: [
      {
        id: 'r1',
        userId: 'user_2',
        userName: 'احسان کریمی',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
        userClass: '۱۱ ریاضی ۲',
        rating: 5,
        comment: 'فوق‌العاده بود! کتاب کاملا سالم تحویل داده شد و حسن‌آقا خیلی وقت‌شناس بودن.',
        date: '۱۴۰۲/۰۸/۰۲'
      },
      {
        id: 'r2',
        userId: 'user_3',
        userName: 'سارا احمدی',
        userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
        userClass: '۱۰ انسانی ۱',
        rating: 5,
        comment: 'هر بار که می‌خونم نکته جدیدی یاد می‌گیرم. ترجمه خوبی هم داره.',
        date: '۱۴۰۲/۰۹/۱۰'
      }
    ]
  },
  {
    id: 'b2',
    title: 'دنیای سوفی',
    author: 'یوستین گردر',
    ownerId: 'user_1',
    ownerName: 'حسن محمدی',
    ownerClass: '۱۰ تجربی ۱',
    ownerAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250',
    coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600',
    category: 'تاریخ و فلسفه',
    condition: 'خوب',
    description: 'داستانی داستانی و جذاب درباره تاریخ فلسفه از یونان باستان تا عصر حاضر در قالب نامه‌های مرموز به یک دختر نوجوان.',
    status: 'available',
    rating: 4.8,
    reviewsCount: 3,
    addedDate: '۱۴۰۲/۰۷/۱۸',
    reviews: [
      {
        id: 'r3',
        userId: 'user_4',
        userName: 'علی رضایی',
        userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
        userClass: '۱۲ تجربی ۳',
        rating: 5,
        comment: 'بهترین کتاب برای شروع مطالعه فلسفه. متن روانی داره.',
        date: '۱۴۰۲/۰۸/۲۰'
      }
    ]
  },
  {
    id: 'b3',
    title: 'دنیاهای موازی',
    author: 'میچیو کاکو',
    ownerId: 'user_2',
    ownerName: 'احسان کریمی',
    ownerClass: '۱۱ ریاضی ۲',
    ownerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    coverImage: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=600',
    category: 'علمی و دانستنی‌ها',
    condition: 'عالی (نو)',
    description: 'سفری جالب به نظریه ریسمان، سیاهچاله‌ها، ابعاد بالاتر و کیهان‌شناسی مدرن به زبان ساده و همه‌فهم.',
    status: 'available',
    rating: 4.7,
    reviewsCount: 4,
    addedDate: '۱۴۰۲/۰۸/۰۲',
    reviews: []
  },
  {
    id: 'b4',
    title: 'سمفونی مردگان',
    author: 'عباس معروفی',
    ownerId: 'user_3',
    ownerName: 'سارا احمدی',
    ownerClass: '۱۰ انسانی ۱',
    ownerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
    coverImage: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=600',
    category: 'ادبیات و رمان',
    condition: 'خوب',
    description: 'یکی از شگفت‌انگیزترین رمان‌های ادبیات معاصر ایران. داستان خانواده اورخانی در اردبیل و سرنوشت آیدین شاعر.',
    status: 'borrowed',
    borrowerId: 'user_1',
    borrowerName: 'حسن محمدی',
    rating: 5.0,
    reviewsCount: 6,
    addedDate: '۱۴۰۲/۰۷/۱۲',
    reviews: [
      {
        id: 'r4',
        userId: 'user_1',
        userName: 'حسن محمدی',
        userAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250',
        userClass: '۱۰ تجربی ۱',
        rating: 5,
        comment: 'رمانی فوق‌العاده با توصیف‌های شاعرانه و عمیق. پیشنهاد می‌کنم حتما بخونید.',
        date: '۱۴۰۲/۰۸/۱۵'
      }
    ]
  },
  {
    id: 'b5',
    title: 'قصه‌های مجید',
    author: 'هوشنگ مرادی کرمانی',
    ownerId: 'user_3',
    ownerName: 'سارا احمدی',
    ownerClass: '۱۰ انسانی ۱',
    ownerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
    coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=600',
    category: 'داستان و نوجوان',
    condition: 'عالی (نو)',
    description: 'ماجراهای طنز و صمیمی نوجوان اصفهانی مجید و بی‌بی. پر از صمیمیت و درس‌های زندگی.',
    status: 'available',
    rating: 4.9,
    reviewsCount: 8,
    addedDate: '۱۴۰۲/۰۷/۱۴',
    reviews: []
  },
  {
    id: 'b6',
    title: 'انسان در جستجوی معنی',
    author: 'ویکتور فرانکل',
    ownerId: 'user_4',
    ownerName: 'علی رضایی',
    ownerClass: '۱۲ تجربی ۳',
    ownerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
    coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=600',
    category: 'روانشناسی و موفقیت',
    condition: 'خوب',
    description: 'تجربیات دکتر فرانکل در اردوگاه اجباری و معرفی لوگوتراپی (معنادرمانی) برای یافتن هدف در سخت‌ترین شرایط زندگی.',
    status: 'available',
    rating: 4.8,
    reviewsCount: 7,
    addedDate: '۱۴۰۲/۰۸/۱۶',
    reviews: []
  },
  {
    id: 'b7',
    title: 'تئوری همه‌چیز',
    author: 'استیون هاوکینگ',
    ownerId: 'user_2',
    ownerName: 'احسان کریمی',
    ownerClass: '۱۱ ریاضی ۲',
    ownerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    coverImage: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=600',
    category: 'علمی و دانستنی‌ها',
    condition: 'عالی (نو)',
    description: 'هفت گفتار درباره تاریخچه کیهان، انفجار بزرگ و تلاش فیزیکدانان برای کشف فرمول واحد جهان.',
    status: 'available',
    rating: 4.9,
    reviewsCount: 2,
    addedDate: '۱۴۰۲/۰۸/۰۵',
    reviews: []
  },
  {
    id: 'b8',
    title: 'گلستان سعدی',
    author: 'شیخ اجل سعدی شیرازی',
    ownerId: 'user_1',
    ownerName: 'حسن محمدی',
    ownerClass: '۱۰ تجربی ۱',
    ownerAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250',
    coverImage: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=600',
    category: 'شعر و هنر',
    condition: 'عالی (نو)',
    description: 'شاهکار منثور و مسجع ادبیات فارسی شامل حکایت‌های اخلاقی و پندآموز با اعراب‌گذاری کامل و شرح واژگان.',
    status: 'available',
    rating: 5.0,
    reviewsCount: 11,
    addedDate: '۱۴۰۲/۰۷/۲۰',
    reviews: []
  }
];

export const INITIAL_REQUESTS: LendingRequest[] = [
  {
    id: 'req_1',
    bookId: 'b3',
    bookTitle: 'دنیاهای موازی',
    bookCover: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=600',
    ownerId: 'user_2',
    ownerName: 'احسان کریمی',
    ownerClass: '۱۱ ریاضی ۲',
    borrowerId: 'user_1',
    borrowerName: 'حسن محمدی',
    borrowerClass: '۱۰ تجربی ۱',
    borrowerPhone: '09123456789',
    status: 'pending',
    pickupShift: 'morning',
    createdAt: '۱۴۰۳/۰۵/۱۱ - ۱۰:۳۰'
  },
  {
    id: 'req_2',
    bookId: 'b4',
    bookTitle: 'سمفونی مردگان',
    bookCover: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=600',
    ownerId: 'user_3',
    ownerName: 'سارا احمدی',
    ownerClass: '۱۰ انسانی ۱',
    borrowerId: 'user_1',
    borrowerName: 'حسن محمدی',
    borrowerClass: '۱۰ تجربی ۱',
    borrowerPhone: '09123456789',
    status: 'accepted',
    pickupLocation: 'جلوی دفتر پرورشی مدرسه',
    pickupTime: 'فردا - زنگ تفریح دوم (۱۰:۱۵)',
    pickupShift: 'morning',
    handoverWindow: 'مهلت ۱۲ ساعته نیم‌روزی (تایید از منزل بدون نیاز به گوشی در مدرسه)',
    createdAt: '۱۴۰۳/۰۵/۱۰ - ۱۶:۰۰',
    acceptedAt: '۱۴۰۳/۰۵/۱۰ - ۱۸:۲۰'
  }
];

export const CATEGORIES = [
  'همه تصنیف‌ها',
  'داستان و قصه کودک',
  'کمیک و کتاب تصویری',
  'شعر و ترانه کودکانه',
  'علمی و رازهای جهان',
  'سرگرمی، بازی و معما',
  'افسانه‌ها و اساطیر',
  'حیوانات و طبیعت',
  'ادبیات و نوجوان',
  'روانشناسی و مهارت زندگی'
];
