declare module 'africastalking' {
  interface AfricasTalkingConfig {
    apiKey: string;
    username: string;
  }

  interface SMSSendOptions {
    to: string[];
    message: string;
    from?: string;
    enqueue?: boolean;
  }

  interface SMSSendResult {
    SMSMessageData: {
      Message: string;
      Recipients: Array<{
        statusCode: number;
        number: string;
        status: string;
        cost: string;
        messageId: string;
      }>;
    };
  }

  interface SMS {
    send(options: SMSSendOptions): Promise<SMSSendResult>;
  }

  interface AfricasTalkingInstance {
    SMS: SMS;
  }

  function AfricasTalking(config: AfricasTalkingConfig): AfricasTalkingInstance;

  export = AfricasTalking;
}
