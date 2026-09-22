import bcrypt from 'bcrypt';
import User from '../models/user.js';
import Role from '../models/role.js';

const safeUser = (user) => ({
    id: user._id.toString(),
    displayName: user.displayName,
    username: user.username,
    email: user.email,
    role: user.role?.name || user.role,
});

const setSessionUser = (req, user) => new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
        if (error) {
            reject(error);
            return;
        }

        req.session.user = safeUser(user);
        req.session.save((saveError) => saveError ? reject(saveError) : resolve());
    });
});

const registrationValues = (body) => ({
    displayName: body.displayName?.trim(),
    username: body.username?.trim().toLowerCase(),
    email: body.email?.trim().toLowerCase(),
    password: body.password,
});

const safeRegistrationValues = (values) => ({
    displayName: values.displayName,
    username: values.username,
    email: values.email,
});

const validRegistration = ({ displayName, username, email, password }) => (
    displayName && username && email && password &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && password.length >= 8
);

const registerUser = async ({ displayName, username, email, password }) => {
    const role = await Role.findOne({ name: 'user' });
    if (!role) {
        throw new Error('The standard user role is not configured.');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    return User.create({ displayName, username, email, passwordHash, role: role._id });
};

const registerPage = (req, res) => {
    if (req.session?.user) {
        return res.redirect('/');
    }

    return res.render('auth/register', { title: 'Register', error: null, values: {} });
};

const registerPageSubmit = async (req, res, next) => {
    const values = registrationValues(req.body);
    if (!validRegistration(values) || values.password !== req.body.confirmPassword) {
        return res.status(400).render('auth/register', {
            title: 'Register',
            error: 'Enter valid information and matching passwords.',
            values: safeRegistrationValues(values),
        });
    }

    try {
        await registerUser(values);
        return res.redirect('/login');
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).render('auth/register', {
                title: 'Register',
                error: 'Username or email is already in use.',
                values: safeRegistrationValues(values),
            });
        }
        return next(error);
    }
};

const loginUser = async (username, password) => {
    const user = await User.findOne({ username: username.trim().toLowerCase() })
        .select('+passwordHash')
        .populate('role');
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return null;
    }
    return user;
};

const loginPage = (req, res) => {
    if (req.session?.user) {
        return res.redirect('/');
    }

    return res.render('auth/login', { title: 'Log In', error: null });
};

const loginPageSubmit = async (req, res, next) => {
    if (!req.body.username || !req.body.password) {
        return res.status(400).render('auth/login', {
            title: 'Log In',
            error: 'Username and password are required.',
        });
    }

    try {
        const user = await loginUser(req.body.username, req.body.password);
        if (!user) {
            return res.status(401).render('auth/login', {
                title: 'Log In',
                error: 'Invalid username or password.',
            });
        }

        await setSessionUser(req, user);
        return res.redirect('/');
    } catch (error) {
        return next(error);
    }
};

const logout = (req, res, next) => {
    if (!req.session) {
        return res.redirect('/login');
    }

    return req.session.destroy((error) => {
        if (error) {
            return next(error);
        }
        res.clearCookie('connect.sid');
        return res.redirect('/login');
    });
};

const registerApi = async (req, res, next) => {
    const values = registrationValues(req.body);
    if (!validRegistration(values)) {
        return res.status(400).json({ error: 'Invalid registration data' });
    }

    try {
        const user = await registerUser(values);
        return res.status(201).json({ message: 'Registration successful', user: safeUser(await user.populate('role')) });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ error: 'Username or email is already in use' });
        }
        return next(error);
    }
};

const loginApi = async (req, res, next) => {
    if (!req.body.username || !req.body.password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const user = await loginUser(req.body.username, req.body.password);
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        await setSessionUser(req, user);
        return res.status(200).json({ user: req.session.user });
    } catch (error) {
        return next(error);
    }
};

const currentUserApi = (req, res) => res.json({ user: req.session.user });

const logoutApi = (req, res, next) => {
    if (!req.session) {
        return res.status(204).send();
    }

    return req.session.destroy((error) => {
        if (error) {
            return next(error);
        }
        res.clearCookie('connect.sid');
        return res.status(204).send();
    });
};

export {
    currentUserApi,
    loginApi,
    loginPage,
    loginPageSubmit,
    logout,
    logoutApi,
    registerApi,
    registerPage,
    registerPageSubmit,
};