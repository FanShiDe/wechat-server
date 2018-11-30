import mongoose from 'mongoose';

exports.register = async (server, options, next) => {
  try {
    const { host, port, db_name } = options;
    await mongoose.connect(
      `mongodb://${host}:${port}/${db_name}`,
      { useNewUrlParser: true },
    );
    const db = mongoose.connection;
    db.on('error', (err) => {
      server.log(['hapi-mongodb', 'error'], {
        msg: err.message || 'mongodb occured error',
      });
    });

    db.on('connected', () => {
      console.log(
        '🍏 mongodb connect success: ',
        `mongodb://${host}:${port}/${db_name}`,
      );
      server.log(['hapi-mongodb', 'info'], { msg: 'mongodb connected' });
    });

    db.on('open', () => {
      console.log(
        '🍏 mongodb connect success: ',
        `mongodb://${host}:${port}/${db_name}`,
      );
    });

    server.on('stop', () => {
      server.log(['server', 'info'], { msg: 'server is closed' });
    });
    return next();
  } catch (e) {
    server.log(['hapi-mongodb', 'error'], { msg: e.message });
    return next();
  }
};

exports.register.attributes = {
  name: 'mongodbConnect',
  version: '1.0.0',
};
