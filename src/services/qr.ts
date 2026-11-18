import QRCode from 'qrcode';

export async function generateQRCodeSvg(text: string): Promise<string> {
  return QRCode.toString(text, {
    type: 'svg',
    margin: 1,
    width: 180,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
}
