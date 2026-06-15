export type ClientSeed = {
  name: string;
  nameAr: string;
  nationalId: string;
  phone: string;
  email: string;
  joinedDaysAgo: number;        // for "new client" badging
  suitability: number;          // 1-100
  hijriDaysToYearEnd: number;   // negative = overdue; positive = upcoming
  family: {
    spouse: boolean;
    sons: number;
    daughters: number;
    fatherAlive: boolean;
    motherAlive: boolean;
  };
  retireAge: number;
  monthlyExpenseSar: number;
  aumSar: number;
  archetype: "growth" | "balanced" | "conservative" | "family_office" | "young";
};

// 12 for Saad (advisor 1), 8 for Sara (advisor 2)
export const CLIENTS_SAAD: ClientSeed[] = [
  { name: "Abdullah Al-Qahtani", nameAr: "عبدالله القحطاني", nationalId: "1078451293", phone: "+966551200001", email: "abdullah.q@example.sa", joinedDaysAgo: 420, suitability: 72, hijriDaysToYearEnd: 18, family: { spouse: true, sons: 2, daughters: 3, fatherAlive: false, motherAlive: true }, retireAge: 60, monthlyExpenseSar: 28000, aumSar: 1_280_000, archetype: "family_office" },
  { name: "Fahad Al-Ghamdi", nameAr: "فهد الغامدي", nationalId: "1085673421", phone: "+966551200002", email: "fahad.g@example.sa", joinedDaysAgo: 280, suitability: 84, hijriDaysToYearEnd: 92, family: { spouse: true, sons: 1, daughters: 1, fatherAlive: true, motherAlive: true }, retireAge: 55, monthlyExpenseSar: 19000, aumSar: 640_000, archetype: "growth" },
  { name: "Mohammed Al-Harbi", nameAr: "محمد الحربي", nationalId: "1093218776", phone: "+966551200003", email: "mohammed.h@example.sa", joinedDaysAgo: 600, suitability: 55, hijriDaysToYearEnd: 35, family: { spouse: true, sons: 0, daughters: 2, fatherAlive: false, motherAlive: false }, retireAge: 62, monthlyExpenseSar: 14000, aumSar: 380_000, archetype: "balanced" },
  { name: "Khaled Al-Otaibi", nameAr: "خالد العتيبي", nationalId: "1104567892", phone: "+966551200004", email: "khaled.o@example.sa", joinedDaysAgo: 14, suitability: 90, hijriDaysToYearEnd: 220, family: { spouse: false, sons: 0, daughters: 0, fatherAlive: true, motherAlive: true }, retireAge: 50, monthlyExpenseSar: 11000, aumSar: 145_000, archetype: "young" },
  { name: "Saud Al-Mutairi", nameAr: "سعود المطيري", nationalId: "1112345678", phone: "+966551200005", email: "saud.m@example.sa", joinedDaysAgo: 195, suitability: 68, hijriDaysToYearEnd: 6, family: { spouse: true, sons: 3, daughters: 1, fatherAlive: false, motherAlive: true }, retireAge: 60, monthlyExpenseSar: 22000, aumSar: 510_000, archetype: "balanced" },
  { name: "Faisal Al-Shehri", nameAr: "فيصل الشهري", nationalId: "1123456789", phone: "+966551200006", email: "faisal.s@example.sa", joinedDaysAgo: 9, suitability: 78, hijriDaysToYearEnd: 145, family: { spouse: true, sons: 1, daughters: 0, fatherAlive: true, motherAlive: true }, retireAge: 58, monthlyExpenseSar: 17000, aumSar: 220_000, archetype: "growth" },
  { name: "Bandar Al-Dosari", nameAr: "بندر الدوسري", nationalId: "1134567890", phone: "+966551200007", email: "bandar.d@example.sa", joinedDaysAgo: 730, suitability: 45, hijriDaysToYearEnd: 56, family: { spouse: true, sons: 2, daughters: 2, fatherAlive: false, motherAlive: false }, retireAge: 65, monthlyExpenseSar: 13000, aumSar: 295_000, archetype: "conservative" },
  { name: "Yousef Al-Anazi", nameAr: "يوسف العنزي", nationalId: "1145678901", phone: "+966551200008", email: "yousef.a@example.sa", joinedDaysAgo: 410, suitability: 80, hijriDaysToYearEnd: 110, family: { spouse: true, sons: 0, daughters: 3, fatherAlive: false, motherAlive: true }, retireAge: 57, monthlyExpenseSar: 18500, aumSar: 415_000, archetype: "growth" },
  { name: "Turki Al-Subaie", nameAr: "تركي السبيعي", nationalId: "1156789012", phone: "+966551200009", email: "turki.s@example.sa", joinedDaysAgo: 22, suitability: 65, hijriDaysToYearEnd: 175, family: { spouse: true, sons: 1, daughters: 1, fatherAlive: true, motherAlive: true }, retireAge: 60, monthlyExpenseSar: 15000, aumSar: 175_000, archetype: "balanced" },
  { name: "Nasser Al-Zahrani", nameAr: "ناصر الزهراني", nationalId: "1167890123", phone: "+966551200010", email: "nasser.z@example.sa", joinedDaysAgo: 350, suitability: 38, hijriDaysToYearEnd: -8, family: { spouse: true, sons: 4, daughters: 2, fatherAlive: false, motherAlive: false }, retireAge: 63, monthlyExpenseSar: 12000, aumSar: 210_000, archetype: "conservative" },
  { name: "Sultan Al-Ruwaili", nameAr: "سلطان الرويلي", nationalId: "1178901234", phone: "+966551200011", email: "sultan.r@example.sa", joinedDaysAgo: 510, suitability: 75, hijriDaysToYearEnd: 245, family: { spouse: true, sons: 2, daughters: 0, fatherAlive: true, motherAlive: true }, retireAge: 56, monthlyExpenseSar: 21000, aumSar: 555_000, archetype: "growth" },
  { name: "Abdulrahman Al-Saif", nameAr: "عبدالرحمن السيف", nationalId: "1189012345", phone: "+966551200012", email: "rahman.s@example.sa", joinedDaysAgo: 6, suitability: 62, hijriDaysToYearEnd: 88, family: { spouse: false, sons: 0, daughters: 0, fatherAlive: true, motherAlive: true }, retireAge: 60, monthlyExpenseSar: 14500, aumSar: 90_000, archetype: "young" },
];

export const CLIENTS_SARA: ClientSeed[] = [
  { name: "Norah Al-Faisal", nameAr: "نورة الفيصل", nationalId: "1200123456", phone: "+966552300001", email: "norah.f@example.sa", joinedDaysAgo: 380, suitability: 70, hijriDaysToYearEnd: 22, family: { spouse: true, sons: 1, daughters: 2, fatherAlive: true, motherAlive: true }, retireAge: 58, monthlyExpenseSar: 19500, aumSar: 425_000, archetype: "balanced" },
  { name: "Reem Al-Saud", nameAr: "ريم آل سعود", nationalId: "1211234567", phone: "+966552300002", email: "reem.s@example.sa", joinedDaysAgo: 720, suitability: 82, hijriDaysToYearEnd: 132, family: { spouse: true, sons: 2, daughters: 1, fatherAlive: false, motherAlive: true }, retireAge: 55, monthlyExpenseSar: 25000, aumSar: 980_000, archetype: "family_office" },
  { name: "Sara Al-Mansouri", nameAr: "سارة المنصوري", nationalId: "1222345678", phone: "+966552300003", email: "sara.m@example.sa", joinedDaysAgo: 25, suitability: 88, hijriDaysToYearEnd: 198, family: { spouse: false, sons: 0, daughters: 0, fatherAlive: true, motherAlive: true }, retireAge: 50, monthlyExpenseSar: 13500, aumSar: 165_000, archetype: "young" },
  { name: "Hessa Al-Khalifa", nameAr: "حصة آل خليفة", nationalId: "1233456789", phone: "+966552300004", email: "hessa.k@example.sa", joinedDaysAgo: 540, suitability: 50, hijriDaysToYearEnd: -3, family: { spouse: true, sons: 0, daughters: 3, fatherAlive: false, motherAlive: false }, retireAge: 60, monthlyExpenseSar: 16000, aumSar: 320_000, archetype: "conservative" },
  { name: "Maha Al-Rashid", nameAr: "مها الراشد", nationalId: "1244567890", phone: "+966552300005", email: "maha.r@example.sa", joinedDaysAgo: 180, suitability: 76, hijriDaysToYearEnd: 65, family: { spouse: true, sons: 2, daughters: 2, fatherAlive: true, motherAlive: true }, retireAge: 56, monthlyExpenseSar: 20000, aumSar: 480_000, archetype: "growth" },
  { name: "Latifa Al-Bassam", nameAr: "لطيفة البسام", nationalId: "1255678901", phone: "+966552300006", email: "latifa.b@example.sa", joinedDaysAgo: 11, suitability: 64, hijriDaysToYearEnd: 230, family: { spouse: true, sons: 1, daughters: 0, fatherAlive: true, motherAlive: true }, retireAge: 58, monthlyExpenseSar: 15500, aumSar: 195_000, archetype: "balanced" },
  { name: "Aisha Al-Tamimi", nameAr: "عائشة التميمي", nationalId: "1266789012", phone: "+966552300007", email: "aisha.t@example.sa", joinedDaysAgo: 290, suitability: 73, hijriDaysToYearEnd: 100, family: { spouse: false, sons: 0, daughters: 0, fatherAlive: false, motherAlive: true }, retireAge: 60, monthlyExpenseSar: 12000, aumSar: 245_000, archetype: "conservative" },
  { name: "Lulwa Al-Jabri", nameAr: "لولوة الجبري", nationalId: "1277890123", phone: "+966552300008", email: "lulwa.j@example.sa", joinedDaysAgo: 450, suitability: 79, hijriDaysToYearEnd: 158, family: { spouse: true, sons: 0, daughters: 2, fatherAlive: true, motherAlive: true }, retireAge: 55, monthlyExpenseSar: 17500, aumSar: 380_000, archetype: "growth" },
];
