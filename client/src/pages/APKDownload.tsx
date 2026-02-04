import { Download, Smartphone, Undo2, Apple } from 'lucide-react';

const APKDownload = () => {
  const downloadApk = (isBC: boolean) => {
    const fileName = isBC ? 'Mobitech_Diagnose_2.2.10(BC).apk' : 'Mobitech_Diagnose_2.2.10.apk';
    const link = document.createElement('a');
    link.href = `/apk/${fileName}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-12 px-4">
      <main className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-blue-400 mb-4">Mobitech Diagnose</h1>
          <p className="text-xl text-gray-300">
            Download our diagnostic app for your device
          </p>
        </div>

        <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8">
          {/* Android Regular Version Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 shadow-2xl border border-gray-700 hover:border-green-500 transition-all duration-300">
            <div className="flex justify-center mb-6">
              <Smartphone className="text-green-500" size={80} strokeWidth={2} />
            </div>
            <h2 className="text-2xl font-semibold text-center mb-2 text-white">Android</h2>
            <p className="text-green-400 text-center font-medium mb-4">Regular Version</p>
            <p className="text-gray-300 mb-6 text-center text-sm">
              For modern Android devices with latest features
            </p>
            <button 
              onClick={() => downloadApk(false)} 
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Download size={20} />
              Download APK (v2.2.10)
            </button>
            <div className="mt-4 text-sm text-gray-400 text-center">
              Requires Android 8.0 or later
            </div>
          </div>

          {/* Android BC Version Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 shadow-2xl border border-gray-700 hover:border-orange-500 transition-all duration-300">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Smartphone className="text-orange-500" size={80} strokeWidth={2} />
                <Undo2 className="text-orange-400 absolute bottom-2 -right-1" size={24} />
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-center mb-2 text-white">Android</h2>
            <p className="text-orange-400 text-center font-medium mb-4">Legacy Version</p>
            <p className="text-gray-300 mb-6 text-center text-sm">
              For older Android devices with backward compatibility
            </p>
            <button 
              onClick={() => downloadApk(true)} 
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Download size={20} />
              Download BC APK (v2.2.10)
            </button>
            <div className="mt-4 text-sm text-gray-400 text-center">
              Requires Android 5.0 or later
            </div>
          </div>

          {/* iOS Download Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 shadow-2xl border border-gray-700 opacity-75">
            <div className="flex justify-center mb-6">
              <Apple className="text-gray-400" size={80} strokeWidth={2} />
            </div>
            <h2 className="text-2xl font-semibold text-center mb-2 text-white">iOS</h2>
            <p className="text-gray-400 text-center font-medium mb-4">Coming Soon</p>
            <p className="text-gray-300 mb-6 text-center text-sm">
              Available on the App Store soon
            </p>
            <button 
              disabled 
              className="w-full bg-gray-700 text-gray-400 font-semibold py-3 px-6 rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Apple size={20} />
              Coming Soon
            </button>
            <div className="mt-4 text-sm text-gray-400 text-center">
              Requires iOS 14 or later
            </div>
          </div>
        </div>

        {/* Version Information Section */}
        <div className="mt-12 bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 shadow-2xl border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4 text-center">
            Which version should I choose?
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="text-lg font-medium text-green-400 mb-2">Regular Version</h4>
              <ul className="text-gray-300 space-y-1 text-sm">
                <li>• Latest features and optimizations</li>
                <li>• Better performance</li>
                <li>• Modern UI components</li>
                <li>• Recommended for most users</li>
              </ul>
            </div>
            <div className="border-l-4 border-orange-500 pl-4">
              <h4 className="text-lg font-medium text-orange-400 mb-2">Legacy Version (BC)</h4>
              <ul className="text-gray-300 space-y-1 text-sm">
                <li>• Compatible with older devices</li>
                <li>• Reduced system requirements</li>
                <li>• Stable on legacy hardware</li>
                <li>• Choose if regular version doesn't work</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center text-gray-400 text-sm">
          <p>By downloading, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </main>
    </div>
  );
};

export default APKDownload;