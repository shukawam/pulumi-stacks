import * as pulumi from "@pulumi/pulumi";
import { Data } from "./data/data";
import { K8sHelidonAppDeployment } from "./modules/k8s-helidon-app-deployment";
import { K8sHelidonAppIngress } from "./modules/k8s-helidon-app-ingress";
import { K8sHelidonAppService } from "./modules/k8s-helidon-app-service";

let config = new pulumi.Config();
const data = config.requireObject<Data>("data");

const service = new K8sHelidonAppService(data.appName, data.namespace).create();
const deployment = new K8sHelidonAppDeployment(
  data.appName,
  data.namespace,
  data.deployment.replicas,
  data.deployment.image
).create();
const ingress = new K8sHelidonAppIngress(
  data.appName,
  data.namespace,
  data.ingress.tls.hosts,
  data.ingress.tls.secretName
).create();

export const deploymentName = deployment.metadata.name;
export const serviceName = service.metadata.name;
export const ingressName = ingress.metadata.name;
