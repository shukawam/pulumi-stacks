import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

export class K8sHelidonAppService {
  appName: string;
  appLabels: { app: string };
  namespace: string;

  constructor(appName: string, namespace: string) {
    this.appName = appName;
    this.namespace = namespace;
    this.appLabels = { app: appName };
  }

  create(): k8s.core.v1.Service {
    const metadata: pulumi.Input<k8s.types.input.meta.v1.ObjectMeta> = {
      name: this.appName,
      namespace: this.namespace,
      labels: {
        app: this.appName,
        "prometheus.io/scrape": "true",
      },
    };
    const spec: pulumi.Input<k8s.types.input.core.v1.ServiceSpec> = {
      type: "ClusterIP",
      selector: this.appLabels,
      ports: [
        {
          port: 8080,
          targetPort: 8080,
          name: "http",
        },
      ],
    };
    return new k8s.core.v1.Service(this.appName, {
      kind: "Service",
      apiVersion: "v1",
      metadata: metadata,
      spec: spec,
    });
  }
}
