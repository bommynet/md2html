const fs = require('fs')
const Remarkable = require('remarkable')
const md = new Remarkable({
    html: true,
    xhtmlOut: true,
    breaks: false,
    langPrefix: 'language-',
    linkify: false,
    typographer:  false,
    quotes: '„“‘’',
    highlight: () => ''
})


function Converter_Md2Html(dir_md, dir_html, relativeToScript = true) {

    const DIR_IN = (relativeToScript ? __dirname : '') + (dir_md.endsWith('/') ? dir_md : dir_md + '/')
    const DIR_OUT = (relativeToScript ? __dirname : '') + (dir_html.endsWith('/') ? dir_html : dir_html + '/')

    const createFilenames = function(filename) {
        // filename has to be a string
        if(!filename || typeof filename !== 'string') return null;

        // remove extension
        filename = filename.substr(0, filename.lastIndexOf('.'))

        return {
            md: DIR_IN + filename + '.md',
            html: DIR_OUT + filename + '.html'
        }
    }

    const getAllFiles = function(dirIn = DIR_IN, dirOut = DIR_OUT) {

        // read IN dir
        let files_in = fs.readdirSync(dirIn)
        
        // create file name objects
        return files_in.map(file => createFilenames(file))
    }

    const isHtmlDeprecated = function(file_md, file_html) {
        // check if files existing
        const exists_md = fs.existsSync(file_md)
        const exists_html = fs.existsSync(file_html)

        // check special conditions
        // 1. no md-file -> no conversion
        // 2. no html-file -> convert
        if(!exists_md) return false
        if(exists_md && !exists_html) return true

        // get file modified times
        let modified_md = fs.statSync(file_md).ctime
        let modified_html = fs.statSync(file_html).ctime

        if(modified_md > modified_html)
            return true
        else
            return false
    }

    const execRemarkable = function(file_md, file_html) {

        // read raw md data
        let rawtext = fs.readFileSync(file_md)

        // write to .html
        fs.writeFileSync(file_html, md.render(rawtext.toString()))

        console.log('   converted:', file_md, '=>', file_html)
    }

    this.convertAllFiles = function() {
        let files = getAllFiles()
            .filter(obj => fs.existsSync(obj.md))
    
        // iterate over files and convert them to html
        files.forEach(file => {
            execRemarkable(file.md, file.html)
        })
    }
    
    this.convertDeprecatedFiles = function() {
        console.log('Checking for deprecated files...')

        let files = getAllFiles()
            .filter(obj => fs.existsSync(obj.md))
            .filter(obj => isHtmlDeprecated(obj.md, obj.html))
    
        // iterate over files and convert them to html
        files.forEach(file => {
            execRemarkable(file.md, file.html)
        })

        console.log('...done.\n')
    }

    this.convertFile = function(filename) {
        let file = createFilenames(filename)

        if(!fs.existsSync(file.md)) {
            console.log('No valid file:', file.md)
            return
        }

        execRemarkable(file.md, file.html)
    }

    this.watch = function(precheck = true) {
        if(precheck)
            this.convertDeprecatedFiles()

        console.log('Start watching folder:', DIR_IN)

        fs.watch(DIR_IN, {encoding: 'utf-8'}, (eventType, filename) => {
            let file = createFilenames(filename)

            if(fs.existsSync(file.md))
                execRemarkable(file.md, file.html)
        })
    }
}



const conv = new Converter_Md2Html('/../in', '/../out')
conv.watch()