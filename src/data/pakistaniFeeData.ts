import { Student, ClassSection, FeeCategory, FeeStructure, FeeVoucher, FeePayment } from '../types/erp';

export const initialFeeCategories: FeeCategory[] = [];
export const initialPakistaniFeeStructures: FeeStructure[] = [];
export const initialPakistaniClasses: ClassSection[] = [];
export const initialPakistaniStudents: Student[] = [];
export const initialPakistaniVouchers: FeeVoucher[] = [];
export const initialPakistaniPayments: FeePayment[] = [];

const FIRST_NAMES_BOYS = [
  'Muhammad', 'Ahmed', 'Ali', 'Hamza', 'Bilal', 'Usman', 'Zain', 'Hassan',
  'Hussein', 'Omar', 'Mustafa', 'Saad', 'Abdullah', 'Talha', 'Haris',
  'Danish', 'Fahad', 'Waqas', 'Ayan', 'Shahmeer', 'Arham', 'Rayyan',
  'Rohail', 'Subhan', 'Taimoor', 'Sheraz', 'Daniyal', 'Farhan', 'Faizan', 'Asad'
];

const FIRST_NAMES_GIRLS = [
  'Fatima', 'Ayesha', 'Zainab', 'Maryam', 'Noor', 'Khadija', 'Hafsa', 'Anaya',
  'Eshal', 'Areeba', 'Laiba', 'Mahnoor', 'Hira', 'Sana', 'Iqra', 'Alishba',
  'Bisma', 'Kinza', 'Rameen', 'Amna', 'Manahil', 'Mehak', 'Bushra', 'Rabia',
  'Sidra', 'Zoya', 'Nawal', 'Hooria', 'Dua', 'Maira'
];

const LAST_NAMES = [
  'Khan', 'Malik', 'Chaudhry', 'Sheikh', 'Bhatti', 'Raza', 'Qureshi',
  'Abbasi', 'Siddiqui', 'Dar', 'Butt', 'Jutt', 'Mirza', 'Baig', 'Ansari',
  'Shah', 'Gillani', 'Tariq', 'Iqbal', 'Akram', 'Nawaz', 'Sharif', 'Gondal',
  'Warraich', 'Cheema', 'Gujjar', 'Awan', 'Hashmi', 'Farooqi', 'Kazmi'
];

const CITIES = [
  'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Gujranwala', 'Sialkot'
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export function generate500PakistaniStudents(): Student[] {
  const students: Student[] = [];
  const classes = ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'];
  const sections = ['A', 'B', 'C', 'D'];

  let idCounter = 1001;

  for (let i = 0; i < 500; i++) {
    const isMale = i % 2 === 0;
    const firstNames = isMale ? FIRST_NAMES_BOYS : FIRST_NAMES_GIRLS;
    const firstName = firstNames[i % firstNames.length];
    const lastName = LAST_NAMES[(i * 3 + 7) % LAST_NAMES.length];
    const fatherFirst = FIRST_NAMES_BOYS[(i * 7 + 3) % FIRST_NAMES_BOYS.length];
    const fatherLast = lastName;
    const fatherName = `${fatherFirst} ${fatherLast}`;

    const targetClass = classes[Math.floor(i / 100)];
    const targetSection = sections[Math.floor((i % 100) / 25)];
    const rollNo = ((i % 25) + 1).toString().padStart(2, '0');
    const admissionNo = `RPS-${2026}-${String(idCounter).padStart(4, '0')}`;
    const city = CITIES[i % CITIES.length];

    const birthYear = 2009 + Math.floor(i / 100);
    const birthMonth = String((i % 12) + 1).padStart(2, '0');
    const birthDay = String((i % 28) + 1).padStart(2, '0');
    const dob = `${birthYear}-${birthMonth}-${birthDay}`;

    students.push({
      id: `stu-500-${idCounter}`,
      admissionNo,
      admissionNumber: admissionNo,
      name: `${firstName} ${lastName}`,
      firstName,
      lastName,
      gender: isMale ? 'Male' : 'Female',
      dob,
      dateOfBirth: dob,
      cnicOrBForm: `35201-${String(1000000 + i)}-${(i % 9) + 1}`,
      bFormNumber: `35201-${String(1000000 + i)}-${(i % 9) + 1}`,
      bloodGroup: BLOOD_GROUPS[i % BLOOD_GROUPS.length],
      phone: `+92 30${i % 9} ${String(1000000 + i).slice(0, 7)}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${idCounter}@school.edu.pk`,
      address: `House #${(i % 150) + 1}, Street ${(i % 20) + 1}, Sector ${String.fromCharCode(65 + (i % 6))}, ${city}`,
      admissionDate: '2025-04-01',
      enrollmentDate: '2025-04-01',
      class: targetClass,
      section: targetSection,
      rollNumber: rollNo,
      parentName: fatherName,
      fatherName,
      parentPhone: `+92 33${(i + 2) % 9} ${String(2000000 + i).slice(0, 7)}`,
      fatherPhone: `+92 33${(i + 2) % 9} ${String(2000000 + i).slice(0, 7)}`,
      parentOccupation: i % 3 === 0 ? 'Business' : i % 3 === 1 ? 'Government Service' : 'Private Sector',
      fatherOccupation: i % 3 === 0 ? 'Business' : i % 3 === 1 ? 'Government Service' : 'Private Sector',
      parentRelation: 'Father',
      emergencyContact: `+92 33${(i + 2) % 9} ${String(2000000 + i).slice(0, 7)}`,
      emergencyContactPerson: fatherName,
      attendanceRate: 85 + (i % 15),
      feeStatus: i % 5 === 0 ? 'Pending' : i % 8 === 0 ? 'Overdue' : 'Paid',
      status: 'Active',
      photoUrl: isMale
        ? `https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=60`
        : `https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=60`,
    });

    idCounter++;
  }

  return students;
}

