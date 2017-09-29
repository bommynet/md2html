/**
 * Converter modul - markdown to hmtl.
 * @module md2html
 */
function Converter_Md2Html(dir_md, dir_html, relativeToScript = true) {
    // requires file system and converter
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

    // system specific path separator
    const path_sep = require('path').sep
    
    /**
     * Function to help creating correct path names.
     * @param path {string} path to folder
     */
    const createPath = function(path) {
        // be sure path ends with '/' - e.g. 'path/'
        path = path.endsWith('/')   ? path : path + path_sep

        // make absolute path from relative input
        if(relativeToScript) {
            path = path.startsWith('/') ? path : path_sep + path
            path = __dirname + path
        }

        return path
    }

    // creating correct paths
    const DIR_IN = createPath(dir_md)
    const DIR_OUT = createPath(dir_html)

    /**
     * Create an internal filename-object.
     * @param {string} filename 
     * @returns {object} filename-object with elements 'md' and 'html'
     */
    const createFilenames = function(filename) {
        // filename has to be a string
        if(!filename || typeof filename !== 'string') return null;

        // remove extension
        if(filename.lastIndexOf('.') >= 0)
            filename = filename.substr(0, filename.lastIndexOf('.'))

        // create and return filename-obejct
        return {
            md: DIR_IN + filename + '.md',
            html: DIR_OUT + filename + '.html'
        }
    }

    /**
     * Checks if markdown-html pair is deprecated.
     * @param {string} file_object
     */
    const isHtmlDeprecated = function(file_object) {
        // check if files existing
        const exists_md = fs.existsSync(file_object.md)
        const exists_html = fs.existsSync(file_object.html)

        // check special conditions
        // 1. no md-file -> no conversion
        // 2. no html-file -> convert
        if(!exists_md) return false
        if(exists_md && !exists_html) return true

        // get file modified times
        const modified_md = fs.statSync(file_object.md).ctime
        const modified_html = fs.statSync(file_object.html).ctime

        if(modified_md > modified_html)
            return true
        else
            return false
    }

    /**
     * Converts markdown file to html file.
     * @param {object} file_object 
     */
    const execRemarkable = function(file_object) {

        // read raw md data
        const rawtext = fs.readFileSync(file_object.md)

        // write to .html
        fs.writeFileSync(file_object.html, md.render(rawtext.toString()))

        console.log('   converted:', file_object.md, '=>', file_object.html)
    }


    /**
     * Convert all md-files to html.
     */
    this.convertAllFiles = function() {
        const files = fs.readdirSync(DIR_IN)
            .map(file => createFilenames(file))
            .filter(obj => fs.existsSync(obj.md)) // really usefull?
            .forEach(file => execRemarkable(file))
    }
    
    /**
     * Convert all deprecated file-pairs to html.
     * Checks if markdown was updated or html doesn't exist and
     * converts md to html if needed.
     */
    this.convertDeprecatedFiles = function() {
        console.log('Checking for deprecated files...')

        const files = fs.readdirSync(DIR_IN)
            .map(file => createFilenames(file))
            .filter(obj => fs.existsSync(obj.md)) // really usefull?
            .filter(obj => isHtmlDeprecated(obj))
            .forEach(file => execRemarkable(file))

        console.log('...done.\n')
    }

    /**
     * Convert a single markdown file to html.
     * @param filename {string} markdown file existing in 'DIR_IN' to convert to html
     */
    this.convertFile = function(filename) {
        const file = createFilenames(filename)

        // check if file is valid
        if(!fs.existsSync(file.md)) {
            console.log('No valid file:', file.md)
            return
        }

        // execute conversion
        execRemarkable(file)
    }

    /**
     * Start a converter deamon.
     * Monitors files in 'DIR_IN' and converts modified markdown files.
     * @param precheck {boolean} if true, it will be checked for deprecated files on start
     */
    this.watch = function(precheck = true) {
        if(precheck)
            this.convertDeprecatedFiles()

        console.log('Start watching folder:', DIR_IN)

        fs.watch(DIR_IN, {encoding: 'utf-8'}, (eventType, filename) => {
            const file = createFilenames(filename)

            if(fs.existsSync(file.md))
                execRemarkable(file)
        })
    }
}



const conv = new Converter_Md2Html('../in', '../out')
conv.convertDeprecatedFiles()
conv.watch()