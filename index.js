const Converter = require('./modules/md2html')

// read commandline arguments (first two are node and this script)
const reduced = process.argv
                .reduce((prev, curr, index) => (index > 1 ? prev + curr + " " : prev + ''), '')
                .split(' ')

// no arguments -> no converter daemon
if(process.argv.length <= 2) {
    const text = 'Usage: node index.js path\n'
               + '       node index.js path_in path_out\n'
               + '\n'
               + 'Options:\n'
               + '       path      path to store markdown and html files\n'
               + '       path_in   path to markdown files\n'
               + '       path_out  path to store converted files'

    console.log(text)
}

// two separate path for in and out
else if(process.argv.length === 4) {
    // '../' to set path relative to module/md2html
    const conv = new Converter('../' + reduced[0], '../' + reduced[1])
    conv.watch()
}

// one path for in and out
else {
    // '../' to set path relative to module/md2html
    const conv = new Converter('../' + reduced[0], '../' + reduced[0])
    conv.watch()
}