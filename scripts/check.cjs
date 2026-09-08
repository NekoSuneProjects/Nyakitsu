const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

function check(directory) {
  for (const entry of fs.readdirSync(directory,{withFileTypes:true})) {
    const file = path.join(directory,entry.name)
    if (entry.isDirectory()) check(file)
    else if (file.endsWith('.cjs')) {
      const result = spawnSync(process.execPath,['--check',file],{stdio:'inherit',windowsHide:true})
      if (result.status !== 0) process.exit(result.status || 1)
    }
  }
}
check('electron')
console.log('Electron modules passed syntax checks.')
