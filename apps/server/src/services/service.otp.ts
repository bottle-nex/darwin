export default class OtpService {

    static async store_otp(email: string, otp: string): Promise<void> {

    }

    static code_key(email: string) {
        return `otp:${email.toLocaleLowerCase()}`;
    }
    static attempt_key(email: string) {
        return `otp:${email.toLocaleLowerCase()}:attempts`;
    }
}
