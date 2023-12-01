import * as pulumi from "@pulumi/pulumi";

import { Data } from "./data/data";
import { VcnProvider } from "./providers/vcn-provider";
import { InstanceProvider } from "./providers/instance-provider";
import { readFileSync } from "fs";

const config = new pulumi.Config();
const data = config.requireObject<Data>("data");

const vcnProvider = new VcnProvider(
  data.compartmentId,
  data.vcn.prefix,
  data.vcn.cidrBlock,
  data.vcn.publicSubnet,
  data.vcn.privateSubnet
);
const networkIds = vcnProvider.createNetwork();

const instanceProvider = new InstanceProvider(
  data.compartmentId,
  data.instance.prefix
);

const ad = pulumi.output(instanceProvider.listAds()).availabilityDomains[0]
  .name;
const shape = pulumi.output(instanceProvider.listShapes()).shapes[0].name;
const image = pulumi.output(instanceProvider.listImages()).images[0].id;

const userData = readFileSync('./user_data/user_data.yaml');

export const instance = instanceProvider.createInstance(
  ad,
  shape,
  data.instance.ocpus,
  data.instance.memoryInGbs,
  image,
  networkIds.publicSubnetId,
  userData,
);
