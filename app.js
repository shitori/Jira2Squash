var createError = require('http-errors')
var express = require('express')
var fileupload = require('express-fileupload')
var path = require('path')
var cookieParser = require('cookie-parser')
var logger = require('morgan')

var guiRouter = require('./routes/gui')
var apiRouter = require('./routes/api')

var app = express()
app.use(fileupload())

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))
app.use(
    '/favicon.ico',
    express.static(path.join(__dirname, 'public', 'images', 'favicon.ico'))
)
app.use('/', guiRouter)
app.use('/api/', apiRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404))
})

// error handler
app.use(function (err, req, res) {
    // set locals, only providing error in development
    res.locals.message = err.message
    res.locals.error = req.app.get('env') === 'development' ? err : {}

    // render the error page
    res.status(err.status || 500)
    res.render('error')
})

module.exports = app
