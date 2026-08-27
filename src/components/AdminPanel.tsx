import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { EditProfileModal } from './EditProfileModal';
import {
  ShieldAlert,
  UserCheck,
  UserX,
  BookOpen,
  Clock,
  CheckCircle2,
  Trash2,
  Users,
  Search,
  BookPlus,
  ShieldCheck,
  GraduationCap,
  Plus,
  Edit2,
  Check,
  X,
  CreditCard,
  FileCheck,
  XCircle,
  Save,
  LogOut,
  Edit3
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const {
    currentUser,
    logoutUser,
    users,
    books,
    requests,
    approveUser,
    rejectUser,
    deleteBook,
    schoolClasses,
    addSchoolClass,
    updateSchoolClass,
    deleteSchoolClass,
    bankCardInfo,
    updateBankCardInfo,
    verifyPaymentByAdmin
  } = useApp();

  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'pending_users' | 'bank_card' | 'all_books' | 'all_users' | 'class_management'
  >('pending_users');
  const [searchQuery, setSearchQuery] = useState('');

  // Bank Card Form State
  const [cardNumber, setCardNumber] = useState(bankCardInfo.cardNumber);
  const [cardHolderName, setCardHolderName] = useState(bankCardInfo.cardHolderName);
  const [bankName, setBankName] = useState(bankCardInfo.bankName);
  const [cardSaveMsg, setCardSaveMsg] = useState('');

  // Class Management Form State
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState('پایه اول');
  const [isExternal, setIsExternal] = useState(false);

  // Editing Class inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editGrade, setEditGrade] = useState('');

  const pendingUsers = users.filter((u) => u.status === 'pending');
  const approvedStudents = users.filter((u) => u.status === 'approved' && u.role === 'student');
  const pendingPayments = requests.filter((r) => r.status === 'payment_proof_submitted');

  const handleSaveBankCard = (e: React.FormEvent) => {
    e.preventDefault();
    updateBankCardInfo({
      cardNumber: cardNumber.trim(),
      cardHolderName: cardHolderName.trim(),
      bankName: bankName.trim()
    });
    setCardSaveMsg('اطلاعات کارت با موفقیت به‌روزرسانی شد.');
    setTimeout(() => setCardSaveMsg(''), 4000);
  };

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    addSchoolClass({
      name: newClassName.trim(),
      grade: newClassGrade,
      isExternal
    });
    setNewClassName('');
    setIsExternal(false);
  };

  const startEdit = (c: { id: string; name: string; grade: string }) => {
    setEditingId(c.id);
    setEditName(c.name);
    setEditGrade(c.grade);
  };

  const saveEdit = (id: string) => {
    if (!editName.trim()) return;
    updateSchoolClass(id, editName.trim(), editGrade);
    setEditingId(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-6 rounded-3xl shadow-xl flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs px-3 py-1 rounded-full font-bold">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>پنل اختصاصی مسئول کتابخانه مدرسه</span>
          </div>

          <h2 className="text-2xl font-black">
            مدیریت صلاحیت اعضا، کلاس‌ها و نظارت بر کتابخانه 👑
          </h2>
          <p className="text-xs text-slate-300">
            بررسی و تایید ثبت‌نام دانش‌آموزان جدید، مدیریت نام کلاس‌های مدرسه و تایید کتاب‌ها
          </p>
        </div>

        {/* Admin User Actions & Quick Stats */}
        <div className="flex items-center gap-3 flex-wrap">
          {currentUser && (
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-2.5 px-3.5 rounded-2xl border border-white/15">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-11 h-11 rounded-xl object-cover ring-2 ring-amber-400 shrink-0"
              />
              <div className="text-right">
                <div className="text-xs font-black text-white flex items-center gap-1">
                  <span>{currentUser.name}</span>
                  <span className="text-[10px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-md font-bold">مدیر</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => setShowEditProfileModal(true)}
                    className="text-[11px] text-amber-300 hover:text-amber-200 font-bold flex items-center gap-0.5 underline cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    ویرایش مشخصات و آواتار
                  </button>
                  <span className="text-white/30">•</span>
                  <button
                    onClick={() => {
                      if (confirm('آیا از حساب کاربری مدیریت خارج می‌شوید؟')) {
                        logoutUser();
                      }
                    }}
                    className="text-[11px] text-rose-300 hover:text-rose-200 font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    <LogOut className="w-3 h-3" />
                    خروج
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-center">
            <div className="text-2xl font-black text-amber-400">{pendingUsers.length} نفر</div>
            <div className="text-[10px] text-slate-300">در انتظار تایید</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-center">
            <div className="text-2xl font-black text-indigo-300">{schoolClasses.length} کلاس</div>
            <div className="text-[10px] text-slate-300">کلاس‌های تعریف‌شده</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs max-w-2xl flex-wrap gap-1">
        <button
          onClick={() => setActiveTab('pending_users')}
          className={`relative flex-1 min-w-[130px] py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'pending_users'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>تایید افراد ({pendingUsers.length})</span>
          {pendingUsers.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute top-2 left-2" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('bank_card')}
          className={`relative flex-1 min-w-[150px] py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'bank_card'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4 text-emerald-400" />
          <span>کارت به کارت و فیش‌ها ({pendingPayments.length})</span>
          {pendingPayments.length > 0 && (
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse absolute top-2 left-2" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('class_management')}
          className={`flex-1 min-w-[130px] py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'class_management'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>مدیریت کلاس‌ها ({schoolClasses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('all_books')}
          className={`flex-1 min-w-[130px] py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'all_books'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>مدیریت کتاب‌ها ({books.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('all_users')}
          className={`flex-1 min-w-[130px] py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'all_users'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>دانش‌آموزان ({approvedStudents.length})</span>
        </button>
      </div>

      {/* Tab 1: Pending User Registrations */}
      {activeTab === 'pending_users' && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <span>درخواست‌های جدید ثبت‌نام در انتظار تایید مسئول کتابخانه:</span>
          </h3>

          {pendingUsers.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h4 className="font-bold text-slate-800 text-base">هیچ درخواست معوقه‌ای وجود ندارد!</h4>
              <p className="text-xs text-slate-500">
                تمامی دانش‌آموزان جدید بررسی و تعیین تکلیف شده‌اند.
              </p>
            </div>
          ) : (
            pendingUsers.map((user) => {
              const userBooks = books.filter((b) => b.ownerId === user.id);

              return (
                <div
                  key={user.id}
                  className="bg-white rounded-3xl p-6 border-2 border-amber-200 shadow-xs space-y-4"
                >
                  <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-14 h-14 rounded-full object-cover ring-2 ring-amber-400"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-slate-900 text-lg">{user.name}</h4>
                          <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                            کلاس {user.className}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          شماره تماس: <strong className="text-slate-800">{user.phone}</strong> • تاریخ ثبت‌نام: {user.joinedDate}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => approveUser(user.id)}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-100 transition flex items-center gap-1.5"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>تایید صلاحیت دانش‌آموز</span>
                      </button>

                      <button
                        onClick={() => rejectUser(user.id)}
                        className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                      >
                        <UserX className="w-4 h-4" />
                        <span>عدم تایید</span>
                      </button>
                    </div>
                  </div>

                  {/* Submitted Books Preview */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">
                      📚 کتاب‌های اولیه ارائه‌شده جهت اشتراک‌گذاری ({userBooks.length} جلد):
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {userBooks.map((b) => (
                        <div
                          key={b.id}
                          className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3 text-xs"
                        >
                          <img
                            src={b.coverImage}
                            alt={b.title}
                            className="w-10 h-14 object-cover rounded-lg shadow-2xs shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900 leading-tight">{b.title}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{b.author}</div>
                            <span className="inline-block mt-1 bg-white px-2 py-0.5 rounded text-[10px] text-emerald-800 font-bold">
                              {b.condition}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab: Bank Card & Payment Proof Verification */}
      {activeTab === 'bank_card' && (
        <div className="space-y-6">
          {/* Card Config Box */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <span>تنظیمات کارت بانکی دریافت هزینه امانت (کارت به کارت) 💳</span>
              </h3>
              <span className="text-xs bg-emerald-50 text-emerald-800 font-bold px-3 py-1 rounded-full border border-emerald-200">
                مدیر سایت: پارسا فیض
              </span>
            </div>

            {cardSaveMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{cardSaveMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveBankCard} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">شماره کارت بانکی (۱۶ رقمی):</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="6037-xxxx-xxxx-xxxx"
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-left tracking-widest text-slate-900"
                  dir="ltr"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">نام و خانوادگی صاحب کارت:</label>
                <input
                  type="text"
                  value={cardHolderName}
                  onChange={(e) => setCardHolderName(e.target.value)}
                  placeholder="پارسا فیض"
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">نام بانک صادرکننده:</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="مثلا: بانک ملی ایران"
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  required
                />
              </div>

              <div className="sm:col-span-3 pt-2">
                <button
                  type="submit"
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>ذخیره مشخصات کارت بانکی</span>
                </button>
              </div>
            </form>
          </div>

          {/* Pending Payment Proofs List */}
          <div className="space-y-4">
            <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-indigo-600" />
              <span>فیش‌ها و کد‌های پیگیری ارسالی کاربران در انتظار تایید ({pendingPayments.length} مورد):</span>
            </h3>

            {pendingPayments.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-slate-800 text-base">هیچ فیش پرداخت معوقه‌ای وجود ندارد!</h4>
                <p className="text-xs text-slate-500">
                  تمامی واریزهای کارت به کارت کاربران بررسی و تایید شده‌اند.
                </p>
              </div>
            ) : (
              pendingPayments.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-3xl p-6 border-2 border-emerald-300 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                      <img
                        src={req.bookCover}
                        alt={req.bookTitle}
                        className="w-12 h-16 rounded-xl object-cover shadow-xs shrink-0"
                      />
                      <div>
                        <h4 className="font-black text-slate-900 text-base">{req.bookTitle}</h4>
                        <p className="text-xs text-slate-600 font-bold mt-1">
                          امانت‌گیرنده: <span className="text-cyan-700">{req.borrowerName}</span> ({req.borrowerClass}) • مالک کتاب: {req.ownerName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => verifyPaymentByAdmin(req.id, true)}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>تایید واریز و تایید نهایی امانت</span>
                      </button>

                      <button
                        onClick={() => verifyPaymentByAdmin(req.id, false)}
                        className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>رد پرداخت</span>
                      </button>
                    </div>
                  </div>

                  {/* Payment Details Box */}
                  <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">کد پیگیری واریز:</span>
                      <strong className="text-emerald-900 text-sm font-black tracking-wider" dir="ltr">
                        {req.paymentProof?.trackingCode || 'ثبت نشده'}
                      </strong>
                    </div>

                    <div>
                      <span className="text-slate-500 block">تاریخ و زمان واریز:</span>
                      <strong className="text-slate-800 font-bold">
                        {req.paymentProof?.paymentDate || 'ثبت نشده'}
                      </strong>
                    </div>

                    <div>
                      <span className="text-slate-500 block">تاریخ ثبت فیش در سایت:</span>
                      <strong className="text-slate-800 font-bold">
                        {req.paymentProof?.submittedAt || req.createdAt}
                      </strong>
                    </div>

                    {req.paymentProof?.receiptImage && (
                      <div className="sm:col-span-3 pt-2">
                        <span className="text-slate-600 font-bold block mb-1">تصویر فیش واریزی بارگذاری‌شده:</span>
                        <img
                          src={req.paymentProof.receiptImage}
                          alt="تصویر فیش واریزی"
                          className="max-h-48 rounded-xl border border-emerald-300 shadow-sm object-contain bg-white p-1"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 2: School Class Management */}
      {activeTab === 'class_management' && (
        <div className="space-y-6">
          {/* Add New Class Form */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              <span>تعریف کلاس جدید / گزینه «غیره‌یا خارج از مدرسه»:</span>
            </h3>

            <form onSubmit={handleAddClass} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نام دقیق کلاس:</label>
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="مثلاً: کلاس ۱-الف یا ۳-ب"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">پایه تحصیلی:</label>
                <select
                  value={newClassGrade}
                  onChange={(e) => setNewClassGrade(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option value="پایه اول">پایه اول</option>
                  <option value="پایه دوم">پایه دوم</option>
                  <option value="پایه سوم">پایه سوم</option>
                  <option value="پایه چهارم">پایه چهارم</option>
                  <option value="پایه پنجم">پایه پنجم</option>
                  <option value="پایه ششم">پایه ششم</option>
                  <option value="متوسطه اول">متوسطه اول</option>
                  <option value="متوسطه دوم">متوسطه دوم</option>
                  <option value="متفرقه / غیره">متفرقه / غیره</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pb-2">
                <input
                  type="checkbox"
                  id="isExternalCheck"
                  checked={isExternal}
                  onChange={(e) => setIsExternal(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <label htmlFor="isExternalCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                  کلاس غیره / مهمان خارج از مدرسه
                </label>
              </div>

              <button
                type="submit"
                className="py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن کلاس جدید</span>
              </button>
            </form>
          </div>

          {/* Classes Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base">لیست کلاس‌های فعال مدرسه ({schoolClasses.length} کلاس):</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">نام کلاس</th>
                    <th className="p-3">پایه تحصیلی</th>
                    <th className="p-3">نوع کلاس</th>
                    <th className="p-3 text-center">ویرایش / حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {schoolClasses.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-bold text-slate-900">
                        {editingId === c.id ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="p-1 border border-indigo-400 rounded-lg text-xs font-bold"
                          />
                        ) : (
                          c.name
                        )}
                      </td>

                      <td className="p-3 text-slate-600">
                        {editingId === c.id ? (
                          <input
                            type="text"
                            value={editGrade}
                            onChange={(e) => setEditGrade(e.target.value)}
                            className="p-1 border border-indigo-400 rounded-lg text-xs font-bold"
                          />
                        ) : (
                          c.grade
                        )}
                      </td>

                      <td className="p-3">
                        {c.isExternal ? (
                          <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            غیره‌یا مهمان خارج مدرسه
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            کلاس رسمی مدرسه
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        {editingId === c.id ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => saveEdit(c.id)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                              title="ذخیره تغییرات"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg"
                              title="انصراف"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => startEdit(c)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                              title="ویرایش نام کلاس"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`آیا از حذف کلاس «${c.name}» مطمئن هستید؟`)) {
                                  deleteSchoolClass(c.id);
                                }
                              }}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="حذف کلاس"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: All Books Management */}
      {activeTab === 'all_books' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <span>فهرست کل کتاب‌های ثبت‌شده در مدرسه ({books.length} جلد)</span>
            </h3>

            <div className="relative w-64">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در تمام کتاب‌ها..."
                className="w-full text-xs pr-8 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">عنوان کتاب</th>
                  <th className="p-3">نویسنده</th>
                  <th className="p-3">دسته‌بندی</th>
                  <th className="p-3">مالک دانش‌آموز</th>
                  <th className="p-3">کلاس</th>
                  <th className="p-3">وضعیت</th>
                  <th className="p-3 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {books
                  .filter(
                    (b) =>
                      !searchQuery ||
                      b.title.includes(searchQuery) ||
                      b.author.includes(searchQuery) ||
                      b.ownerName.includes(searchQuery)
                  )
                  .map((book) => (
                    <tr key={book.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="w-8 h-10 object-cover rounded-md"
                        />
                        <span>{book.title}</span>
                      </td>
                      <td className="p-3 text-slate-600">{book.author}</td>
                      <td className="p-3 text-slate-600">{book.category}</td>
                      <td className="p-3 font-semibold text-slate-800">{book.ownerName}</td>
                      <td className="p-3 text-slate-500">{book.ownerClass}</td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            book.status === 'available'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {book.status === 'available' ? 'آماده امانت' : 'در دست امانت'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => {
                            if (confirm(`آیا از حذف کتاب «${book.title}» مطمئن هستید؟`)) {
                              deleteBook(book.id);
                            }
                          }}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="حذف کتاب"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: All Students List */}
      {activeTab === 'all_users' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>فهرست دانش‌آموزان تاییدشده کتابخانه ({approvedStudents.length} نفر)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {approvedStudents.map((st) => (
              <div
                key={st.id}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3"
              >
                <img
                  src={st.avatar}
                  alt={st.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500"
                />
                <div>
                  <div className="font-bold text-slate-900 text-sm">{st.name}</div>
                  <div className="text-xs text-slate-500">
                    کلاس {st.className} • ⭐ {st.rating}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                    {st.booksContributedCount} کتاب اشتراکی • {st.booksReadCount} کتاب خوانده
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Admin Profile & Avatar Modal */}
      {showEditProfileModal && (
        <EditProfileModal onClose={() => setShowEditProfileModal(false)} />
      )}
    </div>
  );
};
