export interface Data {
  compartmentId: string;
  vcn: {
    prefix: string;
    cidrBlock: string;
    publicSubnet: string;
    privateSubnet: string;
  };
  instance: {
    prefix: string;
    ocpus: number;
    memoryInGbs: number;
  };
}
