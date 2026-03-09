export interface DeviceInfo {
  model: string;
  brand: string;
  ram: string;
  storage: string;
}

export interface SimpleTestResult {
  status: boolean;
}

export interface ScreenTestResult extends SimpleTestResult {
  multiTouchPassed: boolean;
  coveragePercentage: number;
}

export interface CameraTestResult extends SimpleTestResult {
  frontCameraStatus: boolean;
  backCameraStatus: boolean;
}

export interface FingerprintTestResult {
  status: string | boolean; // Can be "Pass", "Fail", true, false
}

export interface DiagnosticsDataRequest {
  testId: string;
  employeeId: string;
  employeeName: string;
  employeeDbID: string;
  employeeImageKey: string;
  imei1: string;
  imei2: string;
  imeiDetectedModel: string;
  financeStatus: boolean;
  isSimCarWorking: string | boolean;
  isFinanceWarningSkipped: string | boolean;
  timestamp: string;
  deviceInfo: DeviceInfo;
  wifiTest: SimpleTestResult;
  bluetoothTest: SimpleTestResult;
  gpsTest: SimpleTestResult;
  powerButtonTest: SimpleTestResult;
  vibrationTest: SimpleTestResult;
  volumeKeysTest: SimpleTestResult;
  screenDiscolorationTest: SimpleTestResult;
  screenTest: ScreenTestResult;
  earpieceTest: SimpleTestResult;
  speakerTest: SimpleTestResult;
  microphoneTest: SimpleTestResult;
  proximityTest: SimpleTestResult;
  cameraTest: CameraTestResult;
  fingerprintTest: FingerprintTestResult;
  usbPortTest: SimpleTestResult;
  audioJackTest: SimpleTestResult;
}

export interface DiagnosticsDataResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}
