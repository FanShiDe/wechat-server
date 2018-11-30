import * as controller from './controller';

exports.register = (server, options, next) => {
  server.route([
    {
      method: 'post',
      path: '/api/sendMsg',
      config: {
        auth: false,
        tags: ['api', 'sendMsg'],
        description: '接收应用程序发送过来的数据，再向微信推送消息',
        handler: { async: controller.sendMsg },
      },
    },
  ]);

  return next();
};

exports.register.attributes = {
  name: 'sendMsg-api-route',
};
