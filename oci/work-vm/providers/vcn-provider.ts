import {
  DefaultRouteTable,
  DefaultRouteTableArgs,
  GetServicesArgs,
  InternetGateway,
  InternetGatewayArgs,
  NatGateway,
  NatGatewayArgs,
  RouteTable,
  RouteTableArgs,
  SecurityList,
  SecurityListArgs,
  ServiceGateway,
  ServiceGatewayArgs,
  Subnet,
  SubnetArgs,
  Vcn,
  VcnArgs,
  getServices,
} from "@pulumi/oci/core";
import * as pulumi from "@pulumi/pulumi";

export class VcnProvider {
  private compartmentId: string;
  private prefix: string;
  private cidrBlockAll = "0.0.0.0/0";
  private vcnCidr: string;
  private publicSubnetCidr: string;
  private privateSubnetCidr: string;

  private protocol = {
    all: "all",
    icmp: "1",
    tcp: "6",
    udp: "17",
    icmpv6: "58",
  };

  constructor(
    compartmentId: string,
    prefix: string,
    vcnCidr: string,
    publicSubnetCidr: string,
    privateSubnetCidr: string
  ) {
    this.compartmentId = compartmentId;
    this.prefix = prefix;
    this.vcnCidr = vcnCidr;
    this.publicSubnetCidr = publicSubnetCidr;
    this.privateSubnetCidr = privateSubnetCidr;
  }

  createNetwork() {
    // Create VCN and get vcnId
    const vcnId = pulumi.output(this.createVcn()).apply((vcn) => vcn.id);
    // Create Gateway
    const igwId = pulumi
      .output(this.createInternetGateway(vcnId))
      .apply((igw) => igw.id);
    this.createNatGateway(vcnId);
    this.createServiceGateway(vcnId);
    // Create Route Table
    const routeTableId = pulumi
      .output(this.createRouteTable(vcnId, igwId))
      .apply((routeTable) => routeTable.id);
    // Create Security List
    const publicSecurityList = pulumi
      .output(this.createPublicSecurityList(vcnId))
      .apply((secList) => secList.id);
    const privateSecurityList = pulumi
      .output(this.createPrivateSecurityList(vcnId))
      .apply((secList) => secList.id);
    // Create Subnet
    const publicSubnet = this.createSubnet(
      vcnId,
      publicSecurityList,
      routeTableId,
      true
    );
    const privateSubnet = this.createSubnet(
      vcnId,
      privateSecurityList,
      routeTableId,
      false
    );
    this.createDefaultRouteTable(routeTableId, igwId);
    return {
      vcnId: vcnId,
      publicSubnetId: publicSubnet.id,
      privateSubnetId: privateSubnet.id,
    };
  }

  private createVcn() {
    const args: VcnArgs = {
      compartmentId: this.compartmentId,
      displayName: `${this.prefix}-vcn`,
      cidrBlocks: [this.vcnCidr],
      freeformTags: {
        createdBy: "pulumi",
      },
    };
    return new Vcn(`${this.prefix}-vcn`, args);
  }

  private createInternetGateway(vcnId: pulumi.Output<string>): InternetGateway {
    const igwArgs: InternetGatewayArgs = {
      compartmentId: this.compartmentId,
      vcnId: vcnId,
      displayName: `${this.prefix}-igw`,
      freeformTags: {
        createdBy: "pulumi",
      },
    };
    return new InternetGateway(`${this.prefix}-igw`, igwArgs);
  }

  private createNatGateway(vcnId: pulumi.Output<string>): NatGateway {
    const ngwArgs: NatGatewayArgs = {
      compartmentId: this.compartmentId,
      vcnId: vcnId,
      displayName: `${this.prefix}-ngw`,
      freeformTags: {
        createdBy: "pulumi",
      },
    };
    return new NatGateway(`${this.prefix}-ngw`, ngwArgs);
  }

  private createServiceGateway(vcnId: pulumi.Output<string>): ServiceGateway {
    const getServicesArgs: GetServicesArgs = {
      filters: [
        {
          name: "name",
          regex: true,
          values: ["All.*"],
        },
      ],
    };
    const serviceId = pulumi
      .output(getServices(getServicesArgs))
      .apply((services) => services.services[0].id);
    const sgwArgs: ServiceGatewayArgs = {
      compartmentId: this.compartmentId,
      vcnId: vcnId,
      displayName: `${this.prefix}-sgw`,
      services: [
        {
          serviceId: serviceId,
        },
      ],
      freeformTags: {
        createdBy: "pulumi",
      },
    };
    return new ServiceGateway(`${this.prefix}-sgw`, sgwArgs);
  }

  private createRouteTable(
    vcnId: pulumi.Output<string>,
    igwId: pulumi.Output<string>
  ): RouteTable {
    const args: RouteTableArgs = {
      compartmentId: this.compartmentId,
      vcnId: vcnId,
      displayName: `${this.prefix}-rt`,
      routeRules: [
        {
          networkEntityId: igwId,
          destinationType: "CIDR_BLOCK",
          destination: "0.0.0.0/0",
        },
      ],
      freeformTags: {
        createdBy: "pulumi",
      },
    };
    return new RouteTable(`${this.prefix}-rt`, args);
  }

  private createDefaultRouteTable(
    rtId: pulumi.Output<string>,
    igwId: pulumi.Output<string>
  ): DefaultRouteTable {
    const args: DefaultRouteTableArgs = {
      manageDefaultResourceId: rtId,
      compartmentId: this.compartmentId,
      displayName: `${this.prefix}-default-rt`,
      routeRules: [
        {
          networkEntityId: igwId,
          destinationType: "CIDR_BLOCK",
          destination: "0.0.0.0/0",
        },
      ],
    };
    return new DefaultRouteTable(`${this.prefix}-default-rt`, args);
  }

  private createPublicSecurityList(vcnId: pulumi.Output<string>): SecurityList {
    const args: SecurityListArgs = {
      compartmentId: this.compartmentId,
      vcnId: vcnId,
      displayName: `${this.prefix}-pub-sl`,
      ingressSecurityRules: [
        {
          source: this.cidrBlockAll,
          protocol: this.protocol.tcp,
          tcpOptions: {
            max: 22,
            min: 22,
          },
        },
        {
          source: this.cidrBlockAll,
          protocol: this.protocol.icmp,
          icmpOptions: {
            type: 3,
            code: 4,
          },
        },
        {
          source: this.vcnCidr,
          protocol: this.protocol.icmp,
          icmpOptions: {
            type: 3,
          },
        },
      ],
      egressSecurityRules: [
        {
          protocol: this.protocol.all,
          destination: this.cidrBlockAll,
          description: "Allow trafic for all ports",
        },
      ],
      freeformTags: {
        createdBy: "pulumi",
      },
    };
    return new SecurityList(`${this.prefix}-pub-sl`, args);
  }

  private createPrivateSecurityList(
    vcnId: pulumi.Output<string>
  ): SecurityList {
    const args: SecurityListArgs = {
      compartmentId: this.compartmentId,
      vcnId: vcnId,
      displayName: `${this.prefix}-pri-sl`,
      ingressSecurityRules: [
        {
          source: this.vcnCidr,
          protocol: this.protocol.tcp,
          tcpOptions: {
            max: 22,
            min: 22,
          },
        },
        {
          source: this.cidrBlockAll,
          protocol: this.protocol.icmp,
          icmpOptions: {
            type: 3,
            code: 4,
          },
        },
        {
          source: this.vcnCidr,
          protocol: this.protocol.icmp,
          icmpOptions: {
            type: 3,
          },
        },
      ],
      egressSecurityRules: [
        {
          protocol: this.protocol.all,
          destination: this.cidrBlockAll,
          description: "Allow trafic for all ports",
        },
      ],
      freeformTags: {
        createdBy: "pulumi",
      },
    };
    return new SecurityList(`${this.prefix}-pri-sl`, args);
  }

  private createSubnet(
    vcnId: pulumi.Output<string>,
    securityListIds: pulumi.Output<string>,
    routeTableId: pulumi.Output<string>,
    isPublic: boolean
  ): Subnet {
    if (isPublic) {
      const args: SubnetArgs = {
        compartmentId: this.compartmentId,
        cidrBlock: this.publicSubnetCidr,
        vcnId: vcnId,
        securityListIds: [securityListIds],
        displayName: `${this.prefix}-pub-subnet`,
        prohibitPublicIpOnVnic: false,
        routeTableId: routeTableId,
        freeformTags: {
          createdBy: "pulumi",
        },
      };
      return new Subnet(`${this.prefix}-pub-subet`, args);
    } else {
      const args: SubnetArgs = {
        compartmentId: this.compartmentId,
        cidrBlock: this.privateSubnetCidr,
        vcnId: vcnId,
        securityListIds: [securityListIds],
        displayName: `${this.prefix}-pri-subnet`,
        routeTableId: routeTableId,
        freeformTags: {
          createdBy: "pulumi",
        },
      };
      return new Subnet(`${this.prefix}-pri-subet`, args);
    }
  }
}
