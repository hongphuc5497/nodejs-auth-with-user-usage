const express = require('express');
const app = express();
const { users, Countries } = require('./initialData');

app.use(express.json());

const genAPIKey = () => {
	return [...Array(30)]
		.map((e) => ((Math.random() * 36) | 0).toString(36))
		.join('');
};

const authMiddleware = (req, res, next) => {
	const apiKey = req.header('x-api-key');
	const account = users.find(({ api_key }) => api_key === apiKey);
	const today = new Date().toISOString().split('T')[0];
	const MAX = 100;

	if (account) {
		let usageCount = account.usage.findIndex((day) => day.date == today);
		if (usageCount >= 0) {
			if (account.usage[usageCount].count >= MAX) {
				res.status(429).send({
					error: {
						code: 429,
						message: 'Max API calls exceeded.',
					},
				});
			} else {
        account.usage[usageCount].count++;

				next();
			}
		} else {
			account.usage.push({ date: today, count: 1 });

			next();
		}
	} else {
		res.status(403).send({
			error: {
				code: 403,
				message: 'You not allowed.',
			},
		});
	}
};

app.get('/', (req, res) => {
	res.status(200).json({
		data: {
			endpoints: ['/api/users', '/api/countries'],
		},
	});
});

app.get('/api/countries', authMiddleware, (req, res) => {
	res.status(200).send({
		data: Countries,
	});
});

app.get('/api/users', authMiddleware, (req, res) => {
	res.status(200).send({
		data: users,
	});
});

app.post('/api/users', (req, res) => {
	let user = {
		_id: Date.now(),
		api_key: genAPIKey(),
		username: req.body.username,
		usage: [
			{
				date: new Date().toISOString().split('T')[0],
				count: 0,
			},
		],
	};

	users.push(user);

	res.status(201).json({
		data: user,
	});
});

app.listen(8888, (err) => {
	if (err) {
		console.log('Failure to launch port');
		return;
	}

	console.log('Server listening on port 8888');
});
