export interface Data {
  appName: string;
  namespace: string;
  deployment: {
    replicas: number;
    image: string;
  };
  ingress: {
    host: string;
    tls: {
      hosts: string[];
      secretName: string;
    };
  };
}
