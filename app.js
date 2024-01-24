const express = require("express");
const app = express();
const expressLayouts = require("express-ejs-layouts");
const chalk = require("chalk");
const morgan = require("morgan");
const { query, validationResult, body, check, matchedData } = require("express-validator");
const session = require('express-session')
const cookieParser = require('cookie-parser')
const flash = require('connect-flash')
const { loadDataFromFile, createUser, deleteUser, getUserDetails, findUsers, checkForDuplicate, updateUser } = require("./index.js");
const PORT = 3000;

app.set("view engine", "ejs");
app.use(expressLayouts);
app.use(express.static("public"));
app.use(morgan("dev"));
app.use(express.urlencoded());
app.use(cookieParser('secret'))
app.use(session({
    cookie: { maxAge: 6000 },
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}))
app.use(flash())

app.use("/", (req, res, next) => {
    console.log("Middleware");
    next();
});

app.get("/", (req, res) => {
    let users = loadDataFromFile();
    let searchKey = req.query.search
    if (searchKey) {
        users = findUsers(searchKey)
    }
    res.status(200).render("", {
        layout: "layouts/main-layout",
        title: "Home",
        users,
        flash: req.flash('msg'),
    });
});

app.get("/dashboard", (req, res) => {
    loadDataFromFile()
    res.status(200).render("dashboard", {
        layout: "layouts/main-layout",
        title: "Dashboard",
    });
});

app.post("/dashboard", [
    check('name')
        .notEmpty().withMessage('Nama tidak boleh kosong'),
    check('email')
        .notEmpty().withMessage('Email wajib diisi')
        .isEmail().withMessage('Email Tidak Sesuai')
        .custom((value) => {
            const duplicatedEmail = checkForDuplicate('email', value)
            if (duplicatedEmail) {
                throw new Error('Email sudah terdaftar')
            }
            return true
        })
    ,
    check('phone')
        .notEmpty().withMessage('Nomor hp wajib diisi')
        .isMobilePhone('id-ID').withMessage('Nomor tidak sesuai')
        .custom((value) => {
            const duplicatedPhone = checkForDuplicate('phone', value)
            if (duplicatedPhone) {
                throw new Error('Nomer Hp Duplikat')
            }
            return true
        })
],
    (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            res.status(200).render('dashboard', {
                layout: "layouts/main-layout",
                title: `Dashboard`,
                errors: errors.array()
            })
        } else {
            createUser(req.body);
            req.flash('msg', 'Data berhasil ditambahkan')
            res.status(200).redirect("/");
        }

    });

app.get('/dashboard/detail/', (req, res) => {
    const user = getUserDetails(req.query.id)
    if (!user) {
        res.status(404).send('Page Not Found')
    } else {
        res.status(200).render('detail', {
            layout: "layouts/main-layout",
            title: `Detail ${user.name}`,
            user,
        })
    }
})

app.get('/dashboard/delete/:id', (req, res) => {
    const user = getUserDetails(req.params.id)
    if (!user) {
        res.status(404).send('Page Not Found')
    } else {
        deleteUser(req.params.id)
        req.flash('msg', 'Data Berhasil Dihapus')
        res.status(200).redirect('/')
    }
})

app.get('/dashboard/update/', (req, res) => {
    const user = getUserDetails(req.query.id)
    if (!user) {
        res.status(404).send('Page Not Found')
    } else {
        res.status(200).render('update', {
            layout: 'layouts/main-layout',
            title: 'Update',
            user
        })
    }
})

app.post('/dashboard/update/', [
    check('email')
        .notEmpty().withMessage('Email tidak boleh kosong')
        .isEmail().withMessage('Email yang anda masukkan tidak sesuai')
        .custom((value, { req }) => {
            console.log(req.body)
            const duplicatedEmail = checkForDuplicate('email', value)
            if (duplicatedEmail && value !== req.body.oldEmail) {
                throw new Error('Email Duplikat')
            }
            return true
        }),
    check('phone')
        .notEmpty().withMessage('No hp tidak boleh kosong')
        .isMobilePhone('id-ID').withMessage('Nomor yang anda masukkan tidak sesuai')
        .custom((value, { req }) => {
            const duplicatedPhone = checkForDuplicate('phone', value)
            if (duplicatedPhone && value !== req.body.oldPhone) {
                throw new Error('No Hp Duplikat')
            }
            return true
        }),
    check('name')
        .notEmpty().withMessage('Tidak Boleh Kosong ya Adik Adik Namanya'),
], (req, res) => {
    const errors = validationResult(req)
    const user = getUserDetails(req.query.id)
    if (!user) {
        res.status(404).send('Page Not Found')
    } else {
        if (!errors.isEmpty()) {
            res.status(200).render('update', {
                layout: 'layouts/main-layout',
                title: 'Update',
                errors: errors.array(),
                user
            })
        } else {
            updateUser(req.body)
            req.flash('msg', 'Data Berhasil Di Update')
            res.status(200).redirect('/')
        }
    }

})

app.use("/", (req, res) => {
    res.status(404).send(`Page '${req.route ? req.route.path : 'Unknown'}' is Not Found`);
});

app.listen(PORT, () => {
    console.log(chalk.blue(`Server listen on port ${chalk.underline('http://localhost:')}${chalk.underline(PORT)}`));
});
