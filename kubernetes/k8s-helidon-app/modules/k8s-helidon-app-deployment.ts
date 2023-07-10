import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

export class K8sHelidonAppDeployment {
  appName: string;
  appLabels: { app: string };
  namespace: string;
  replicas: number;
  image: string;

  constructor(
    appName: string,
    namespace: string,
    replicas: number,
    image: string
  ) {
    this.appName = appName;
    this.namespace = namespace;
    this.appLabels = { app: appName };
    this.replicas = replicas;
    this.image = image;
  }

  create(): k8s.apps.v1.Deployment {
    const metadata: pulumi.Input<k8s.types.input.meta.v1.ObjectMeta> = {
      name: this.appName,
      namespace: this.namespace,
    };
    const spec: pulumi.Input<k8s.types.input.apps.v1.DeploymentSpec> = {
      replicas: this.replicas,
      selector: {
        matchLabels: this.appLabels,
      },
      template: {
        metadata: { labels: this.appLabels },
        spec: {
          containers: [
            {
              name: this.appName,
              image: this.image,
              imagePullPolicy: "IfNotPresent",
              ports: [
                {
                  name: "api",
                  containerPort: 8080,
                },
              ],
              readinessProbe: this.probeGen("/health/ready"),
              livenessProbe: this.probeGen("/health/live"),
            },
          ],
          imagePullSecrets: [
            {
              name: "ghcr-secret",
            },
          ],
        },
      },
    };
    return new k8s.apps.v1.Deployment(this.appName, {
      kind: "Deployment",
      apiVersion: "apps/v1",
      metadata: metadata,
      spec: spec,
    });
  }

  private probeGen(path: string): pulumi.Input<k8s.types.input.core.v1.Probe> {
    return {
      httpGet: {
        path: path,
        port: "api",
      },
      initialDelaySeconds: 30,
      periodSeconds: 5,
    };
  }
}
