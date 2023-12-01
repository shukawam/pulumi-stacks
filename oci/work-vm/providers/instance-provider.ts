import * as oci from "@pulumi/oci";
import {
  GetImagesArgs,
  GetImagesResult,
  GetShapesArgs,
  Instance,
  InstanceArgs,
} from "@pulumi/oci/core";
import { getImages } from "@pulumi/oci/core/getImages";
import { GetShapesResult, getShapes } from "@pulumi/oci/core/getShapes";
import { GetAvailabilityDomainsArgs } from "@pulumi/oci/identity";
import {
  GetAvailabilityDomainsResult,
  getAvailabilityDomains,
} from "@pulumi/oci/identity/getAvailabilityDomains";
import * as pulumi from "@pulumi/pulumi";

export class InstanceProvider {
  private compartmentId: string;
  private prefix: string;

  constructor(compartmentId: string, prefix: string) {
    this.compartmentId = compartmentId;
    this.prefix = prefix;
  }

  listAds(): Promise<GetAvailabilityDomainsResult> {
    const args: GetAvailabilityDomainsArgs = {
      compartmentId: this.compartmentId,
    };
    return getAvailabilityDomains(args);
  }

  listShapes(): Promise<GetShapesResult> {
    const args: GetShapesArgs = {
      compartmentId: this.compartmentId,
      filters: [
        {
          name: "name",
          values: ["VM.Standard.E.*Flex"],
          regex: true,
        },
      ],
    };
    return getShapes(args);
  }

  listImages(): Promise<GetImagesResult> {
    const args: GetImagesArgs = {
      compartmentId: this.compartmentId,
      operatingSystem: "Canonical Ubuntu",
      operatingSystemVersion: "22.04",
      sortBy: "TIMECREATED",
      sortOrder: "DESC"
    };
    return getImages(args);
  }

  createInstance(
    ad: pulumi.Output<string>,
    shape: pulumi.Output<string>,
    ocpus: number,
    memoryInGbs: number,
    sourceId: pulumi.Output<string>,
    subnetId: pulumi.Output<string>,
    userData: Buffer,
  ): Instance {
    const args: InstanceArgs = {
      availabilityDomain: ad,
      compartmentId: this.compartmentId,
      displayName: this.prefix,
      shape: shape,
      shapeConfig: {
        ocpus: ocpus,
        memoryInGbs: memoryInGbs,
      },
      sourceDetails: {
        sourceType: "image",
        sourceId: sourceId,
      },
      createVnicDetails: {
        assignPublicIp: "true",
        subnetId: subnetId,
      },
      metadata: {
        user_data: Buffer.from(userData).toString("base64"),
      },
    };
    return new oci.core.Instance(`${this.prefix}-compute`, args);
  }
}
