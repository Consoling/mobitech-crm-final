-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'FIELD_EXECUTIVE', 'MARKETING_EXECUTIVE', 'TECHNICIAN', 'STORE_OWNER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "phoneVerified" BOOLEAN,
    "salary" DECIMAL(65,30),
    "payoutDate" INTEGER,
    "password" TEXT NOT NULL,
    "email" TEXT,
    "dateOfJoining" TIMESTAMP(3),
    "dateOfTermination" TIMESTAMP(3),
    "profileImage" TEXT,
    "aadharFrontImage" TEXT,
    "aadharBackImage" TEXT,
    "qualificationImage" TEXT,
    "VehicleFrontImage" TEXT,
    "VehicleBackImage" TEXT,
    "role" "Role",
    "storeId" TEXT,
    "createdBy" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" TEXT,
    "mfaVerified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "userId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Manager" (
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "aadharId" TEXT NOT NULL,

    CONSTRAINT "Manager_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Technician" (
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "aadharId" TEXT NOT NULL,

    CONSTRAINT "Technician_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "FieldExecutive" (
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "aadharId" TEXT NOT NULL,

    CONSTRAINT "FieldExecutive_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "SalesExecutive" (
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "aadharId" TEXT NOT NULL,

    CONSTRAINT "SalesExecutive_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Store" (
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "storeName" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "ownerPhone" TEXT NOT NULL,
    "ownerEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "BankDetails" (
    "id" TEXT NOT NULL,
    "accountNumber" TEXT,
    "ifsc" TEXT,
    "bankName" TEXT,
    "beneficiaryName" TEXT,
    "upiId" TEXT,
    "managerId" TEXT,
    "technicianId" TEXT,
    "fieldExecId" TEXT,
    "salesExecId" TEXT,
    "storeId" TEXT,

    CONSTRAINT "BankDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "location" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceTest" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "employeeId" TEXT,
    "imageUrl" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "device" JSONB NOT NULL,
    "imei1" TEXT,
    "imei2" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectivityTestResult" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL,
    "message" TEXT,
    "timestamp" TIMESTAMP(3),
    "deviceTestId" TEXT NOT NULL,

    CONSTRAINT "ConnectivityTestResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceTestResult" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL,
    "message" TEXT,
    "timestamp" TIMESTAMP(3),
    "deviceTestId" TEXT NOT NULL,

    CONSTRAINT "DeviceTestResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimTestResult" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL,
    "timestamp" TIMESTAMP(3),
    "deviceTestId" TEXT NOT NULL,

    CONSTRAINT "SimTestResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScreenTest" (
    "id" TEXT NOT NULL,
    "multiTouch" BOOLEAN NOT NULL,
    "dotCoverage" BOOLEAN NOT NULL,
    "completed" BOOLEAN NOT NULL,
    "timestamp" TIMESTAMP(3),
    "deviceTestId" TEXT NOT NULL,

    CONSTRAINT "ScreenTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AudioTest" (
    "id" TEXT NOT NULL,
    "speaker" BOOLEAN NOT NULL,
    "earReceiver" BOOLEAN NOT NULL,
    "microphone" BOOLEAN NOT NULL,
    "timestamp" TIMESTAMP(3),
    "deviceTestId" TEXT NOT NULL,

    CONSTRAINT "AudioTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProximitySensorTest" (
    "id" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL,
    "message" TEXT,
    "timestamp" TIMESTAMP(3),
    "deviceTestId" TEXT NOT NULL,

    CONSTRAINT "ProximitySensorTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CameraTest" (
    "id" TEXT NOT NULL,
    "frontCamera" BOOLEAN NOT NULL,
    "backCamera" BOOLEAN NOT NULL,
    "timestamp" TIMESTAMP(3),
    "deviceTestId" TEXT NOT NULL,

    CONSTRAINT "CameraTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FingerprintTest" (
    "id" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL,
    "message" TEXT,
    "timestamp" TIMESTAMP(3),
    "deviceTestId" TEXT NOT NULL,

    CONSTRAINT "FingerprintTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsbTest" (
    "id" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL,
    "message" TEXT,
    "timestamp" TIMESTAMP(3),
    "deviceTestId" TEXT NOT NULL,

    CONSTRAINT "UsbTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AudioJackTest" (
    "id" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL,
    "message" TEXT,
    "timestamp" TIMESTAMP(3),
    "deviceTestId" TEXT NOT NULL,

    CONSTRAINT "AudioJackTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "streetAddress" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "pinCode" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Otp" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attempts" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Otp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomModelBrand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "apiEndpoint" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomModelBrand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomModel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManualDiagnosticsResult" (
    "id" TEXT NOT NULL,
    "diagnoseId" TEXT NOT NULL,
    "employeeId" TEXT,
    "smc" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "imei1" TEXT,
    "imei2" TEXT,
    "screenTouch" TEXT NOT NULL,
    "screenSpot" TEXT NOT NULL,
    "screenLines" TEXT NOT NULL,
    "screenPhysical" TEXT NOT NULL,
    "screenDiscolor" TEXT NOT NULL,
    "screenBubble" TEXT NOT NULL,
    "frontCamera" TEXT NOT NULL,
    "backCamera" TEXT NOT NULL,
    "audioJack" TEXT NOT NULL,
    "wifi" TEXT NOT NULL,
    "gps" TEXT NOT NULL,
    "bluetooth" TEXT NOT NULL,
    "volumeButton" TEXT NOT NULL,
    "flashLight" TEXT NOT NULL,
    "fcImageBlurred" TEXT NOT NULL,
    "bcImageBlurred" TEXT NOT NULL,
    "vibrator" TEXT NOT NULL,
    "battery" TEXT NOT NULL,
    "speaker" TEXT NOT NULL,
    "microphone" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "proximity" TEXT NOT NULL,
    "chargingPort" TEXT NOT NULL,
    "powerButton" TEXT NOT NULL,
    "faceLock" TEXT NOT NULL,
    "copyScreen" TEXT NOT NULL,
    "sim" TEXT NOT NULL,
    "physicalScratch" TEXT NOT NULL,
    "physicalDent" TEXT NOT NULL,
    "physicalPanel" TEXT NOT NULL,
    "physicalBent" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManualDiagnosticsResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Declaration" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "smc" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "imei1" TEXT,
    "imei2" TEXT,
    "bluetooth" TEXT,
    "gps" TEXT,
    "wifi" TEXT,
    "proximity" TEXT,
    "multiTouch" TEXT,
    "screenCalibration" TEXT,
    "speaker" TEXT,
    "earReceiver" TEXT,
    "microphone" TEXT,
    "frontCamera" TEXT,
    "backCamera" TEXT,
    "sim" TEXT,
    "fingerprint" TEXT,
    "chargingPort" TEXT,
    "audioJack" TEXT,
    "isAccepted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "finalAmount" TEXT,
    "phoneNumber" TEXT,
    "customerName" TEXT,
    "modelName" TEXT,

    CONSTRAINT "Declaration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoorstepPickup" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "variant" TEXT,
    "imei1" TEXT,
    "imei2" TEXT,
    "deviceFrontImage" TEXT,
    "deviceBackImage" TEXT,
    "diagnosticsProcess" TEXT,
    "mbdgReport" JSONB,
    "diagnosticsProcessInit" TEXT,
    "qcReportInit" TEXT,
    "qcReport" TEXT,
    "repairRequired" TEXT,
    "repairStatus" TEXT,
    "accessories" TEXT,
    "deviceAge" TEXT,
    "warrantyType" TEXT,
    "hasGstBill" TEXT,
    "gstInvoice" TEXT,
    "boxImeiMatch" TEXT,
    "customerName" TEXT,
    "mobileNumber" TEXT,
    "addressProofType" TEXT,
    "aadharNumber" TEXT,
    "address" TEXT,
    "fullAddress" TEXT,
    "aadharFrontImage" TEXT,
    "aadharBackImage" TEXT,
    "epicNumber" TEXT,
    "voterIdFrontImage" TEXT,
    "voterIdBackImage" TEXT,
    "isAadharVerified" BOOLEAN,
    "voterIdVerified" BOOLEAN,
    "customerSignature" TEXT,
    "deviceReset" TEXT,
    "deviceStartScreenImage" TEXT,
    "customerProofImage" TEXT,
    "cashPaymentReceiptImage" TEXT,
    "paymentMode" TEXT,
    "exchangeModel" TEXT,
    "newModelIMEI" TEXT,
    "manualQcReport" JSONB,
    "remarks" TEXT,
    "finalAmount" TEXT,
    "sellingAmount" TEXT,
    "upiId" TEXT,
    "upiBeneficiaryName" TEXT,
    "isUpiVerified" BOOLEAN,
    "isUpiSaved" BOOLEAN,
    "bankName" TEXT,
    "accountNumber" TEXT,
    "confirmAccountNumber" TEXT,
    "ifscCode" TEXT,
    "bankBeneficiaryName" TEXT,
    "isBankDetailsVerified" BOOLEAN,
    "isBankDetailsSaved" BOOLEAN,
    "paymentStatus" TEXT,
    "utrrrnnumber" TEXT,
    "paidBy" TEXT,
    "purchaserBankName" TEXT,
    "purchaserPaymentMode" TEXT,
    "isMobileNumberVerified" BOOLEAN,
    "isDeclarationSigned" BOOLEAN,
    "phoneVerified" BOOLEAN,
    "repairParts" JSONB,
    "repairDate" TEXT,
    "assignedBC" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerDeclaration" BOOLEAN,
    "purchaseAmount" TEXT,
    "employeeId" TEXT,

    CONSTRAINT "DoorstepPickup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticsData" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "employeeId" TEXT,
    "employeeName" TEXT,
    "employeeDbID" TEXT,
    "employeeImageKey" TEXT,
    "imei1" TEXT,
    "imei2" TEXT,
    "imeiDetectedModel" TEXT,
    "financeStatus" BOOLEAN NOT NULL DEFAULT false,
    "isSimCarWorking" BOOLEAN,
    "isFinanceWarningSkipped" BOOLEAN,
    "timestamp" TIMESTAMP(3),
    "deviceInfo" JSONB,
    "wifiTest" JSONB,
    "bluetoothTest" JSONB,
    "gpsTest" JSONB,
    "powerButtonTest" JSONB,
    "vibrationTest" JSONB,
    "volumeKeysTest" JSONB,
    "screenDiscolorationTest" JSONB,
    "screenTest" JSONB,
    "earpieceTest" JSONB,
    "speakerTest" JSONB,
    "microphoneTest" JSONB,
    "proximityTest" JSONB,
    "cameraTest" JSONB,
    "fingerprintTest" JSONB,
    "usbPortTest" JSONB,
    "audioJackTest" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiagnosticsData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_employeeId_key" ON "Admin"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Manager_employeeId_key" ON "Manager"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Manager_aadharId_key" ON "Manager"("aadharId");

-- CreateIndex
CREATE UNIQUE INDEX "Technician_employeeId_key" ON "Technician"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Technician_aadharId_key" ON "Technician"("aadharId");

-- CreateIndex
CREATE UNIQUE INDEX "FieldExecutive_employeeId_key" ON "FieldExecutive"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "FieldExecutive_aadharId_key" ON "FieldExecutive"("aadharId");

-- CreateIndex
CREATE UNIQUE INDEX "SalesExecutive_employeeId_key" ON "SalesExecutive"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "SalesExecutive_aadharId_key" ON "SalesExecutive"("aadharId");

-- CreateIndex
CREATE UNIQUE INDEX "Store_storeId_key" ON "Store"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "BankDetails_managerId_key" ON "BankDetails"("managerId");

-- CreateIndex
CREATE UNIQUE INDEX "BankDetails_technicianId_key" ON "BankDetails"("technicianId");

-- CreateIndex
CREATE UNIQUE INDEX "BankDetails_fieldExecId_key" ON "BankDetails"("fieldExecId");

-- CreateIndex
CREATE UNIQUE INDEX "BankDetails_salesExecId_key" ON "BankDetails"("salesExecId");

-- CreateIndex
CREATE UNIQUE INDEX "BankDetails_storeId_key" ON "BankDetails"("storeId");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceTest_testId_key" ON "DeviceTest"("testId");

-- CreateIndex
CREATE UNIQUE INDEX "ScreenTest_deviceTestId_key" ON "ScreenTest"("deviceTestId");

-- CreateIndex
CREATE UNIQUE INDEX "AudioTest_deviceTestId_key" ON "AudioTest"("deviceTestId");

-- CreateIndex
CREATE UNIQUE INDEX "ProximitySensorTest_deviceTestId_key" ON "ProximitySensorTest"("deviceTestId");

-- CreateIndex
CREATE UNIQUE INDEX "CameraTest_deviceTestId_key" ON "CameraTest"("deviceTestId");

-- CreateIndex
CREATE UNIQUE INDEX "FingerprintTest_deviceTestId_key" ON "FingerprintTest"("deviceTestId");

-- CreateIndex
CREATE UNIQUE INDEX "UsbTest_deviceTestId_key" ON "UsbTest"("deviceTestId");

-- CreateIndex
CREATE UNIQUE INDEX "AudioJackTest_deviceTestId_key" ON "AudioJackTest"("deviceTestId");

-- CreateIndex
CREATE UNIQUE INDEX "Address_storeId_key" ON "Address"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomModelBrand_name_key" ON "CustomModelBrand"("name");

-- CreateIndex
CREATE INDEX "CustomModel_brandId_idx" ON "CustomModel"("brandId");

-- CreateIndex
CREATE UNIQUE INDEX "ManualDiagnosticsResult_diagnoseId_key" ON "ManualDiagnosticsResult"("diagnoseId");

-- CreateIndex
CREATE UNIQUE INDEX "Declaration_orderId_key" ON "Declaration"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "DoorstepPickup_orderId_key" ON "DoorstepPickup"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosticsData_testId_key" ON "DiagnosticsData"("testId");

-- CreateIndex
CREATE INDEX "DiagnosticsData_testId_idx" ON "DiagnosticsData"("testId");

-- CreateIndex
CREATE INDEX "DiagnosticsData_employeeDbID_idx" ON "DiagnosticsData"("employeeDbID");

-- CreateIndex
CREATE INDEX "DiagnosticsData_imei1_idx" ON "DiagnosticsData"("imei1");

-- CreateIndex
CREATE INDEX "DiagnosticsData_timestamp_idx" ON "DiagnosticsData"("timestamp");

-- AddForeignKey
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Manager" ADD CONSTRAINT "Manager_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Technician" ADD CONSTRAINT "Technician_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldExecutive" ADD CONSTRAINT "FieldExecutive_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesExecutive" ADD CONSTRAINT "SalesExecutive_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankDetails" ADD CONSTRAINT "BankDetails_fieldExecId_fkey" FOREIGN KEY ("fieldExecId") REFERENCES "FieldExecutive"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankDetails" ADD CONSTRAINT "BankDetails_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Manager"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankDetails" ADD CONSTRAINT "BankDetails_salesExecId_fkey" FOREIGN KEY ("salesExecId") REFERENCES "SalesExecutive"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankDetails" ADD CONSTRAINT "BankDetails_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankDetails" ADD CONSTRAINT "BankDetails_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Technician"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectivityTestResult" ADD CONSTRAINT "ConnectivityTestResult_deviceTestId_fkey" FOREIGN KEY ("deviceTestId") REFERENCES "DeviceTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceTestResult" ADD CONSTRAINT "DeviceTestResult_deviceTestId_fkey" FOREIGN KEY ("deviceTestId") REFERENCES "DeviceTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimTestResult" ADD CONSTRAINT "SimTestResult_deviceTestId_fkey" FOREIGN KEY ("deviceTestId") REFERENCES "DeviceTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScreenTest" ADD CONSTRAINT "ScreenTest_deviceTestId_fkey" FOREIGN KEY ("deviceTestId") REFERENCES "DeviceTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AudioTest" ADD CONSTRAINT "AudioTest_deviceTestId_fkey" FOREIGN KEY ("deviceTestId") REFERENCES "DeviceTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProximitySensorTest" ADD CONSTRAINT "ProximitySensorTest_deviceTestId_fkey" FOREIGN KEY ("deviceTestId") REFERENCES "DeviceTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CameraTest" ADD CONSTRAINT "CameraTest_deviceTestId_fkey" FOREIGN KEY ("deviceTestId") REFERENCES "DeviceTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FingerprintTest" ADD CONSTRAINT "FingerprintTest_deviceTestId_fkey" FOREIGN KEY ("deviceTestId") REFERENCES "DeviceTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsbTest" ADD CONSTRAINT "UsbTest_deviceTestId_fkey" FOREIGN KEY ("deviceTestId") REFERENCES "DeviceTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AudioJackTest" ADD CONSTRAINT "AudioJackTest_deviceTestId_fkey" FOREIGN KEY ("deviceTestId") REFERENCES "DeviceTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomModel" ADD CONSTRAINT "CustomModel_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "CustomModelBrand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoorstepPickup" ADD CONSTRAINT "DoorstepPickup_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticsData" ADD CONSTRAINT "DiagnosticsData_employeeDbID_fkey" FOREIGN KEY ("employeeDbID") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
