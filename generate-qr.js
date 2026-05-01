const qrcode = require('qrcode-terminal');

// Adres IP komputera - zmień jeśli potrzeba
const IP_ADDRESS = '192.168.0.234';
const PORT = '8081';

// URL do Expo Go
const expoUrl = `exp://${IP_ADDRESS}:${PORT}`;

console.log('\n===========================================');
console.log('  Go-Fans Mobile - QR Code dla Expo Go');
console.log('===========================================\n');
console.log(`URL: ${expoUrl}\n`);
console.log('Zeskanuj kod QR w aplikacji Expo Go:\n');

qrcode.generate(expoUrl, { small: true }, (qrCode) => {
  console.log(qrCode);
  console.log('\nInstrukcje:');
  console.log('1. Otwórz aplikację Expo Go na telefonie');
  console.log('2. Dotknij "Scan QR Code"');
  console.log('3. Zeskanuj powyższy kod QR');
  console.log('4. Upewnij się że telefon i komputer są w tej samej sieci WiFi');
  console.log('\nBackend API: http://192.168.0.234:3000');
  console.log('===========================================\n');
});
