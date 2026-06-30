// Minimal supplier seeder - only inserts basic supplier records to conserve disk space
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const stateCodes = ['29', '27', '07', '36', '24', '06', '33', '09', '19', '08'];
const generateGST = (i) => {
  const code = stateCodes[i % stateCodes.length];
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const nums = '0123456789';
  return `${code}${chars[i%26]}${chars[(i+3)%26]}${chars[(i+7)%26]}${chars[(i+11)%26]}${chars[(i+13)%26]}${nums[i%10]}${nums[(i+2)%10]}${nums[(i+5)%10]}${nums[(i+7)%10]}${chars[(i+17)%26]}1Z${chars[(i+19)%26]}`;
};
const generateCode = (i) => `SUP-${String(200 + i).padStart(4,'0')}`;

const suppliers = [
  // Batch 1: Major cities - Distributors
  { name: 'MediLine Distributors Pvt Ltd', type: 'Distributor', contact: 'Arjun Sharma', phone: '9800000101', email: 'mediline@pharma.com', city: 'Bangalore', state: 'Karnataka', preferred: true },
  { name: 'HealthCare Wholesale Hub', type: 'Wholesaler', contact: 'Meena Nair', phone: '9800000102', email: 'healthcarehub@pharma.com', city: 'Chennai', state: 'Tamil Nadu', preferred: false },
  { name: 'PharmaBridge India Ltd', type: 'Distributor', contact: 'Vikram Joshi', phone: '9800000103', email: 'pharmabridge@pharma.com', city: 'Pune', state: 'Maharashtra', preferred: true },
  { name: 'NovaCure Pharmaceuticals', type: 'Manufacturer', contact: 'Lakshmi Devi', phone: '9800000104', email: 'novacure@pharma.com', city: 'Hyderabad', state: 'Telangana', preferred: false },
  { name: 'Sunrise MedSupply Co', type: 'Distributor', contact: 'Ravi Pillai', phone: '9800000105', email: 'sunrise@pharma.com', city: 'Kochi', state: 'Kerala', preferred: true },
  { name: 'BioSync Pharma Logistics', type: 'Wholesaler', contact: 'Nandini Rao', phone: '9800000106', email: 'biosync@pharma.com', city: 'Mysore', state: 'Karnataka', preferred: false },
  { name: 'GreenLeaf Medical Supplies', type: 'Distributor', contact: 'Santosh Kumar', phone: '9800000107', email: 'greenleaf@pharma.com', city: 'Coimbatore', state: 'Tamil Nadu', preferred: false },
  { name: 'OmniPharma Distribution', type: 'Distributor', contact: 'Priti Shah', phone: '9800000108', email: 'omnipharma@pharma.com', city: 'Ahmedabad', state: 'Gujarat', preferred: true },
  { name: 'LifeLine Drug House', type: 'Wholesaler', contact: 'Ashish Mehta', phone: '9800000109', email: 'lifeline@pharma.com', city: 'Surat', state: 'Gujarat', preferred: false },
  { name: 'CarePlus Pharma Traders', type: 'Distributor', contact: 'Deepika Singh', phone: '9800000110', email: 'careplus@pharma.com', city: 'Jaipur', state: 'Rajasthan', preferred: true },
  // Batch 2
  { name: 'HealWell Medicines Ltd', type: 'Manufacturer', contact: 'Mohan Lal', phone: '9800000111', email: 'healwell@pharma.com', city: 'Lucknow', state: 'Uttar Pradesh', preferred: false },
  { name: 'PharmaFirst Distributors', type: 'Distributor', contact: 'Seema Tiwari', phone: '9800000112', email: 'pharmafirst@pharma.com', city: 'Nagpur', state: 'Maharashtra', preferred: true },
  { name: 'SecureMed Supply Chain', type: 'Wholesaler', contact: 'Brijesh Patel', phone: '9800000113', email: 'securemed@pharma.com', city: 'Baroda', state: 'Gujarat', preferred: false },
  { name: 'TrueDose Pharmaceuticals', type: 'Manufacturer', contact: 'Kavitha R', phone: '9800000114', email: 'truedose@pharma.com', city: 'Vizag', state: 'Andhra Pradesh', preferred: true },
  { name: 'SwiftPharma Deliveries', type: 'Distributor', contact: 'Anand Krishnan', phone: '9800000115', email: 'swiftpharma@pharma.com', city: 'Madurai', state: 'Tamil Nadu', preferred: false },
  { name: 'AlphaChem Medical', type: 'Wholesaler', contact: 'Farah Khan', phone: '9800000116', email: 'alphachem@pharma.com', city: 'Delhi', state: 'Delhi', preferred: true },
  { name: 'BioMax Healthcare Pvt', type: 'Distributor', contact: 'Rohit Agarwal', phone: '9800000117', email: 'biomax@pharma.com', city: 'Kolkata', state: 'West Bengal', preferred: false },
  { name: 'MedTrust Wholesale', type: 'Wholesaler', contact: 'Ananya Das', phone: '9800000118', email: 'medtrust@pharma.com', city: 'Bhubaneswar', state: 'Odisha', preferred: false },
  { name: 'NovaMed Corp India', type: 'Manufacturer', contact: 'Sujan Babu', phone: '9800000119', email: 'novamed@pharma.com', city: 'Patna', state: 'Bihar', preferred: true },
  { name: 'PrimePharma Supplies', type: 'Distributor', contact: 'Tanvi Jain', phone: '9800000120', email: 'primepharma@pharma.com', city: 'Indore', state: 'Madhya Pradesh', preferred: false },
  // Batch 3
  { name: 'VitalCare Drug House', type: 'Wholesaler', contact: 'Manoj Trivedi', phone: '9800000121', email: 'vitalcare@pharma.com', city: 'Bhopal', state: 'Madhya Pradesh', preferred: true },
  { name: 'MegaMed Trading Ltd', type: 'Distributor', contact: 'Radhika V', phone: '9800000122', email: 'megamed@pharma.com', city: 'Chandigarh', state: 'Chandigarh', preferred: false },
  { name: 'HealthPro Pharma Dist', type: 'Distributor', contact: 'Sanjay Kaur', phone: '9800000123', email: 'healthpro@pharma.com', city: 'Amritsar', state: 'Punjab', preferred: true },
  { name: 'CureMed Wholesale Hub', type: 'Wholesaler', contact: 'Bindu Nambiar', phone: '9800000124', email: 'curemed@pharma.com', city: 'Thiruvananthapuram', state: 'Kerala', preferred: false },
  { name: 'EssentialMeds Traders', type: 'Distributor', contact: 'Ramesh Gowda', phone: '9800000125', email: 'essentialmeds@pharma.com', city: 'Hubli', state: 'Karnataka', preferred: false },
  { name: 'QuickDose Supply Co', type: 'Wholesaler', contact: 'Pooja Nayak', phone: '9800000126', email: 'quickdose@pharma.com', city: 'Mangalore', state: 'Karnataka', preferred: true },
  { name: 'GenericPlus Distributors', type: 'Distributor', contact: 'Dinesh Babu', phone: '9800000127', email: 'genericplus@pharma.com', city: 'Salem', state: 'Tamil Nadu', preferred: false },
  { name: 'FreshMed Solutions', type: 'Manufacturer', contact: 'Usha Devi', phone: '9800000128', email: 'freshmed@pharma.com', city: 'Tirupati', state: 'Andhra Pradesh', preferred: true },
  { name: 'IndiaPharma Links', type: 'Distributor', contact: 'Naveen Kumar', phone: '9800000129', email: 'indiapharma@pharma.com', city: 'Vijayawada', state: 'Andhra Pradesh', preferred: false },
  { name: 'ClinXcel Medical Dist', type: 'Wholesaler', contact: 'Rekha Rani', phone: '9800000130', email: 'clinxcel@pharma.com', city: 'Guwahati', state: 'Assam', preferred: false },
  // Batch 4
  { name: 'RapidMed Pharmaceuticals', type: 'Manufacturer', contact: 'Aditya Menon', phone: '9800000131', email: 'rapidmed@pharma.com', city: 'Pune', state: 'Maharashtra', preferred: true },
  { name: 'GlobalPharma Connect', type: 'Distributor', contact: 'Shruti Bansal', phone: '9800000132', email: 'globalpharma@pharma.com', city: 'Mumbai', state: 'Maharashtra', preferred: false },
  { name: 'UrbanMed Logistics', type: 'Wholesaler', contact: 'Girish Alva', phone: '9800000133', email: 'urbanmed@pharma.com', city: 'Shimoga', state: 'Karnataka', preferred: true },
  { name: 'MedPlus Wholesale India', type: 'Distributor', contact: 'Chandra Sekhar', phone: '9800000134', email: 'medpluswholesale@pharma.com', city: 'Hyderabad', state: 'Telangana', preferred: false },
  { name: 'UniPharma Distribution', type: 'Distributor', contact: 'Parveen Akhtar', phone: '9800000135', email: 'unipharma@pharma.com', city: 'Lucknow', state: 'Uttar Pradesh', preferred: true },
  { name: 'SafeDrug Supply Network', type: 'Wholesaler', contact: 'Monika Rawat', phone: '9800000136', email: 'safedrug@pharma.com', city: 'Dehradun', state: 'Uttarakhand', preferred: false },
  { name: 'BestChoice Pharma', type: 'Distributor', contact: 'Gopal Singh', phone: '9800000137', email: 'bestchoice@pharma.com', city: 'Varanasi', state: 'Uttar Pradesh', preferred: false },
  { name: 'MassiveMed Traders', type: 'Wholesaler', contact: 'Hema Subramaniam', phone: '9800000138', email: 'massivemed@pharma.com', city: 'Coimbatore', state: 'Tamil Nadu', preferred: true },
  { name: 'KareMed Distributors', type: 'Distributor', contact: 'Raja Moorthy', phone: '9800000139', email: 'karemed@pharma.com', city: 'Pondicherry', state: 'Puducherry', preferred: false },
  { name: 'TrustMed Solutions', type: 'Manufacturer', contact: 'Satyendra Pal', phone: '9800000140', email: 'trustmed@pharma.com', city: 'Ghaziabad', state: 'Uttar Pradesh', preferred: true },
  // Batch 5
  { name: 'MaxiCure Pharmaceuticals', type: 'Distributor', contact: 'Shweta Tomar', phone: '9800000141', email: 'maxicure@pharma.com', city: 'Kanpur', state: 'Uttar Pradesh', preferred: false },
  { name: 'CoreMed Wholesale', type: 'Wholesaler', contact: 'Shyam Prasad', phone: '9800000142', email: 'coremed@pharma.com', city: 'Ranchi', state: 'Jharkhand', preferred: true },
  { name: 'PharmaEdge Supplies', type: 'Distributor', contact: 'Sumitra Devi', phone: '9800000143', email: 'pharmaedge@pharma.com', city: 'Jamshedpur', state: 'Jharkhand', preferred: false },
  { name: 'NaturalMed Traders', type: 'Distributor', contact: 'Alka Saxena', phone: '9800000144', email: 'naturalmed@pharma.com', city: 'Agra', state: 'Uttar Pradesh', preferred: true },
  { name: 'SureMed Pharma Corp', type: 'Manufacturer', contact: 'Navin Chopra', phone: '9800000145', email: 'suremed@pharma.com', city: 'Chandigarh', state: 'Punjab', preferred: false },
  { name: 'MediMart Wholesale Ltd', type: 'Wholesaler', contact: 'Asha Menon', phone: '9800000146', email: 'medimart@pharma.com', city: 'Thrissur', state: 'Kerala', preferred: true },
  { name: 'HealthFirst Drug Dist', type: 'Distributor', contact: 'Suhas Wagle', phone: '9800000147', email: 'healthfirst@pharma.com', city: 'Nasik', state: 'Maharashtra', preferred: false },
  { name: 'CureCraft Pharma', type: 'Manufacturer', contact: 'Deepa Kiran', phone: '9800000148', email: 'curecraft@pharma.com', city: 'Mysore', state: 'Karnataka', preferred: false },
  { name: 'VisionMed Suppliers', type: 'Distributor', contact: 'Pramod Reddy', phone: '9800000149', email: 'visionmed@pharma.com', city: 'Nellore', state: 'Andhra Pradesh', preferred: true },
  { name: 'StrongMed Pvt Ltd', type: 'Wholesaler', contact: 'Bijoy Biswas', phone: '9800000150', email: 'strongmed@pharma.com', city: 'Kolkata', state: 'West Bengal', preferred: false },
  // Extra 50 (total 100)
  { name: 'FastCure Logistics', type: 'Distributor', contact: 'Rupali Das', phone: '9800000151', email: 'fastcure@pharma.com', city: 'Siliguri', state: 'West Bengal', preferred: true },
  { name: 'EasyMed Distributors', type: 'Wholesaler', contact: 'Vikash Sinha', phone: '9800000152', email: 'easymed@pharma.com', city: 'Patna', state: 'Bihar', preferred: false },
  { name: 'CleanMed Healthcare', type: 'Distributor', contact: 'Pratibha Singh', phone: '9800000153', email: 'cleanmed@pharma.com', city: 'Raipur', state: 'Chhattisgarh', preferred: false },
  { name: 'InfoMed Pharma', type: 'Manufacturer', contact: 'Vivek Pandey', phone: '9800000154', email: 'infomed@pharma.com', city: 'Indore', state: 'Madhya Pradesh', preferred: true },
  { name: 'QualiMed Trade House', type: 'Wholesaler', contact: 'Bharati Joshi', phone: '9800000155', email: 'qualimed@pharma.com', city: 'Pune', state: 'Maharashtra', preferred: false },
  { name: 'MedCore Distributions', type: 'Distributor', contact: 'Suresh Iyer', phone: '9800000156', email: 'medcore@pharma.com', city: 'Mumbai', state: 'Maharashtra', preferred: true },
  { name: 'PharmaCo International', type: 'Distributor', contact: 'Saranya K', phone: '9800000157', email: 'pharmaco@pharma.com', city: 'Chennai', state: 'Tamil Nadu', preferred: false },
  { name: 'PharmaLink Services', type: 'Wholesaler', contact: 'Vasudevan R', phone: '9800000158', email: 'pharmalink@pharma.com', city: 'Kozhikode', state: 'Kerala', preferred: true },
  { name: 'BrightMed Supplies', type: 'Distributor', contact: 'Geetha Krishnan', phone: '9800000159', email: 'brightmed@pharma.com', city: 'Palakkad', state: 'Kerala', preferred: false },
  { name: 'FullCare Drug Trading', type: 'Wholesaler', contact: 'Mahesh Nair', phone: '9800000160', email: 'fullcare@pharma.com', city: 'Kollam', state: 'Kerala', preferred: false },
  { name: 'ZenMed Pharmaceuticals', type: 'Manufacturer', contact: 'Jayashree V', phone: '9800000161', email: 'zenmed@pharma.com', city: 'Bangalore', state: 'Karnataka', preferred: true },
  { name: 'MedEx Logistics India', type: 'Distributor', contact: 'Pravin Kadam', phone: '9800000162', email: 'medex@pharma.com', city: 'Kolhapur', state: 'Maharashtra', preferred: false },
  { name: 'ExcelMed Supply Hub', type: 'Distributor', contact: 'Neeraj Gupta', phone: '9800000163', email: 'excelmed@pharma.com', city: 'Kanpur', state: 'Uttar Pradesh', preferred: true },
  { name: 'ProMed Trading Co', type: 'Wholesaler', contact: 'Shailendra Verma', phone: '9800000164', email: 'promed@pharma.com', city: 'Allahabad', state: 'Uttar Pradesh', preferred: false },
  { name: 'PureAid Medical Dist', type: 'Distributor', contact: 'Anita Sharma', phone: '9800000165', email: 'pureaid@pharma.com', city: 'Ludhiana', state: 'Punjab', preferred: true },
  { name: 'MedEase Wholesale Ltd', type: 'Wholesaler', contact: 'Harmeet Kaur', phone: '9800000166', email: 'medease@pharma.com', city: 'Jalandhar', state: 'Punjab', preferred: false },
  { name: 'FirstMed Drug House', type: 'Distributor', contact: 'Gurpreet Singh', phone: '9800000167', email: 'firstmed@pharma.com', city: 'Patiala', state: 'Punjab', preferred: false },
  { name: 'ClearDose Pharma Co', type: 'Manufacturer', contact: 'Jitendra Pandya', phone: '9800000168', email: 'cleardose@pharma.com', city: 'Rajkot', state: 'Gujarat', preferred: true },
  { name: 'ChemMed Distributors', type: 'Distributor', contact: 'Ranjit Patel', phone: '9800000169', email: 'chemmed@pharma.com', city: 'Jamnagar', state: 'Gujarat', preferred: false },
  { name: 'MedOptima Wholesale', type: 'Wholesaler', contact: 'Nirupama Dixit', phone: '9800000170', email: 'medoptima@pharma.com', city: 'Bhopal', state: 'Madhya Pradesh', preferred: true },
  { name: 'LifeSaver Drug Traders', type: 'Distributor', contact: 'Omprakash Jha', phone: '9800000171', email: 'lifesaver@pharma.com', city: 'Muzaffarpur', state: 'Bihar', preferred: false },
  { name: 'SafeMeds Distribution', type: 'Wholesaler', contact: 'Mamata Dash', phone: '9800000172', email: 'safemeds@pharma.com', city: 'Cuttack', state: 'Odisha', preferred: false },
  { name: 'MaxPharma India Ltd', type: 'Distributor', contact: 'Mihir Datta', phone: '9800000173', email: 'maxpharma@pharma.com', city: 'Asansol', state: 'West Bengal', preferred: true },
  { name: 'CureMart Pharma', type: 'Wholesaler', contact: 'Goutam Ghosh', phone: '9800000174', email: 'curemart@pharma.com', city: 'Durgapur', state: 'West Bengal', preferred: false },
  { name: 'PharmaOne Corp', type: 'Distributor', contact: 'Priya Sarkar', phone: '9800000175', email: 'pharmaone@pharma.com', city: 'Howrah', state: 'West Bengal', preferred: true },
  { name: 'OptiMed Suppliers', type: 'Manufacturer', contact: 'Tapas Roy', phone: '9800000176', email: 'optimed@pharma.com', city: 'Medinipur', state: 'West Bengal', preferred: false },
  { name: 'ValueMed Drug House', type: 'Distributor', contact: 'Subir Sen', phone: '9800000177', email: 'valuemed@pharma.com', city: 'Agartala', state: 'Tripura', preferred: false },
  { name: 'PharmaDirect Dist', type: 'Wholesaler', contact: 'Pranjal Bora', phone: '9800000178', email: 'pharmadirect@pharma.com', city: 'Dibrugarh', state: 'Assam', preferred: true },
  { name: 'HealMed Healthcare', type: 'Distributor', contact: 'Richa Sharma', phone: '9800000179', email: 'healmed@pharma.com', city: 'Shimla', state: 'Himachal Pradesh', preferred: false },
  { name: 'CityPharma Logistics', type: 'Wholesaler', contact: 'Arun Thakur', phone: '9800000180', email: 'citypharma@pharma.com', city: 'Dharamsala', state: 'Himachal Pradesh', preferred: false },
  { name: 'NorthMed Supply Chain', type: 'Distributor', contact: 'Sunita Bhatt', phone: '9800000181', email: 'northmed@pharma.com', city: 'Haridwar', state: 'Uttarakhand', preferred: true },
  { name: 'PharmaVision Traders', type: 'Manufacturer', contact: 'Satish Dobhal', phone: '9800000182', email: 'pharmavision@pharma.com', city: 'Rishikesh', state: 'Uttarakhand', preferred: false },
  { name: 'CurePro Medical Dist', type: 'Distributor', contact: 'Meenakshi Pal', phone: '9800000183', email: 'curepro@pharma.com', city: 'Nainital', state: 'Uttarakhand', preferred: true },
  { name: 'EastMed Pharma Inc', type: 'Wholesaler', contact: 'Sanjib Dey', phone: '9800000184', email: 'eastmed@pharma.com', city: 'Imphal', state: 'Manipur', preferred: false },
  { name: 'WestMed Distribution Co', type: 'Distributor', contact: 'Krishnaswamy N', phone: '9800000185', email: 'westmed@pharma.com', city: 'Surat', state: 'Gujarat', preferred: true },
  { name: 'SouthMed Wholesale', type: 'Wholesaler', contact: 'Subramani P', phone: '9800000186', email: 'southmed@pharma.com', city: 'Tirunelveli', state: 'Tamil Nadu', preferred: false },
  { name: 'ExpressMed Pharma', type: 'Distributor', contact: 'Sarojini Devi', phone: '9800000187', email: 'expressmed@pharma.com', city: 'Pudukottai', state: 'Tamil Nadu', preferred: false },
  { name: 'MedSupreme Traders', type: 'Wholesaler', contact: 'Sathyamoorthy K', phone: '9800000188', email: 'medsupreme@pharma.com', city: 'Erode', state: 'Tamil Nadu', preferred: true },
  { name: 'FutureMed India Corp', type: 'Distributor', contact: 'Shanmugam R', phone: '9800000189', email: 'futuremed@pharma.com', city: 'Vellore', state: 'Tamil Nadu', preferred: false },
  { name: 'SureMed Logistics', type: 'Distributor', contact: 'Anbalagan M', phone: '9800000190', email: 'suremedlogistics@pharma.com', city: 'Trichy', state: 'Tamil Nadu', preferred: true },
  { name: 'PharmaCentral Ltd', type: 'Manufacturer', contact: 'Swaminathan V', phone: '9800000191', email: 'pharmacentral@pharma.com', city: 'Thanjavur', state: 'Tamil Nadu', preferred: false },
  { name: 'InfraRed Med Dist', type: 'Wholesaler', contact: 'Murugan S', phone: '9800000192', email: 'infraredmed@pharma.com', city: 'Dindigul', state: 'Tamil Nadu', preferred: false },
  { name: 'TotalCare Pharma Dist', type: 'Distributor', contact: 'Periyasamy A', phone: '9800000193', email: 'totalcare@pharma.com', city: 'Cuddalore', state: 'Tamil Nadu', preferred: true },
  { name: 'MedWorld Supplies', type: 'Distributor', contact: 'Selvam K', phone: '9800000194', email: 'medworld@pharma.com', city: 'Karur', state: 'Tamil Nadu', preferred: false },
  { name: 'PharmaMaxx Co', type: 'Wholesaler', contact: 'Thangavelu P', phone: '9800000195', email: 'pharmamaxx@pharma.com', city: 'Nagapattinam', state: 'Tamil Nadu', preferred: true },
  { name: 'LifeStar Pharmaceutical', type: 'Manufacturer', contact: 'Balakrishnan N', phone: '9800000196', email: 'lifestar@pharma.com', city: 'Kanyakumari', state: 'Tamil Nadu', preferred: false },
  { name: 'MediCross Traders', type: 'Distributor', contact: 'Govindarajan S', phone: '9800000197', email: 'medicross@pharma.com', city: 'Krishnagiri', state: 'Tamil Nadu', preferred: false },
  { name: 'DirectMed Distributors', type: 'Wholesaler', contact: 'Arumugam C', phone: '9800000198', email: 'directmed@pharma.com', city: 'Dharmapuri', state: 'Tamil Nadu', preferred: true },
  { name: 'MedIndia Hub', type: 'Distributor', contact: 'Annamalai V', phone: '9800000199', email: 'medindiahub@pharma.com', city: 'Villupuram', state: 'Tamil Nadu', preferred: false },
  { name: 'PharmaGiant Pvt Ltd', type: 'Manufacturer', contact: 'Ramasamy G', phone: '9800000200', email: 'pharmagiant@pharma.com', city: 'Chennai', state: 'Tamil Nadu', preferred: true },
];

async function main() {
  console.log(`🚀 Seeding ${suppliers.length} suppliers (basic info only to conserve disk space)...\n`);
  let createdCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < suppliers.length; i++) {
    const s = suppliers[i];
    const existing = await prisma.supplier.findFirst({ where: { name: s.name } });

    if (!existing) {
      try {
        await prisma.supplier.create({
          data: {
            name: s.name,
            code: generateCode(i + 1),
            supplierType: s.type,
            contactPerson: s.contact,
            phone: s.phone,
            email: s.email,
            addressCity: s.city,
            addressState: s.state,
            addressCountry: 'India',
            gstNumber: generateGST(i + 200),
            creditLimit: 100000 + (i * 10000),
            openingBalance: 0,
            isActive: true,
            isPreferred: s.preferred,
            status: 'Active',
            paymentTermsDays: [15, 30, 45, 60][i % 4],
            paymentMode: ['Bank Transfer', 'Cheque', 'NEFT', 'RTGS'][i % 4],
          }
        });
        createdCount++;
        process.stdout.write(`✅ [${createdCount}/${suppliers.length}] ${s.name}\n`);
      } catch (err) {
        console.error(`❌ Failed: ${s.name} - ${err.message}`);
        break;
      }
    } else {
      skippedCount++;
      process.stdout.write(`⚠️  Already exists: ${s.name}\n`);
    }
  }

  console.log(`\n✅ Done! Created: ${createdCount}, Skipped (existing): ${skippedCount}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
