const { execFile } = require('child_process')
const path = require('path')
const { promisify } = require('util')
const execFileAsync = promisify(execFile)

exports.default = async function afterPack({ appOutDir, packager }) {
  if (packager.platform.name !== 'mac') return
  const appPath = path.join(appOutDir, `${packager.appInfo.productFilename}.app`)
  try {
    // Sign first (writes CodeSignature as files, not xattrs — safe to strip after)
    await execFileAsync('codesign', ['--deep', '--force', '--sign', '-', appPath])
    // Strip all extended attributes (OneDrive/iCloud fileprovider metadata, etc.)
    // that would cause Gatekeeper's strict check to fail with "damaged"
    await execFileAsync('xattr', ['-cr', appPath])
    console.log(`  • ad-hoc signed + xattrs cleared: ${appPath}`)
  } catch (e) {
    console.warn('  • afterPack warning:', e.message)
  }
}
