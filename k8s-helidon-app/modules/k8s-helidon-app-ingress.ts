import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

export class K8sHelidonAppIngress {
  appName: string;
  namespace: string;
  hosts: string[];
  secretName: string;

  constructor(
    appName: string,
    namespace: string,
    hosts: string[],
    secretName: string
  ) {
    this.appName = appName;
    this.namespace = namespace;
    this.hosts = hosts;
    this.secretName = secretName;
  }

  create(): k8s.networking.v1.Ingress {
    const metadata: pulumi.Input<k8s.types.input.meta.v1.ObjectMeta> = {
      name: this.appName,
      namespace: this.namespace,
      annotations: {
        "kubernetes.io/ingress.class": "nginx",
        "cert-manager.io/cluster-issuer": "letsencrypt-prod",
      },
    };
    const spec: pulumi.Input<k8s.types.input.networking.v1.IngressSpec> = {
      tls: [
        {
          hosts: this.hosts,
          secretName: this.secretName,
        },
      ],
      rules: [
        {
          host: this.hosts[0],
          http: {
            paths: [
              {
                backend: {
                  service: {
                    name: this.appName,
                    port: {
                      number: 8080,
                    },
                  },
                },
                pathType: "Prefix",
                path: "/",
              },
            ],
          },
        },
      ],
    };
    return new k8s.networking.v1.Ingress(this.appName, {
      kind: "Ingress",
      apiVersion: "networking.k8s.io/v1",
      metadata: metadata,
      spec: spec,
    });
  }
}
