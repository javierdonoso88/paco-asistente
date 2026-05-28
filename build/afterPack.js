const { execFile } = require('child_process')
const path = require('path')
const { promisify } = require('util')
const execFileAsync = promisify(execFile)

exports.default = async function afterPack({ appOutDir, packager }) {
  if (packager.platform.name !== 'mac') return
  const appPath = path.join(appOutDir, `${packager.appInfo.productFilename}.app`)
  try {
    await execFileAsync('codesign', ['--deep', '--force', '--sign', '-', appPath])
    console.log(`  • ad-hoc signed: ${appPath}`)
  } catch (e) {
    console.warn('  • codesign warning:', e.message)
  }
}
