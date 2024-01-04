import {TCircuitFault} from "../types/circuit-fault.type.ts";

export class FaultCoverage {
    private faults: string[];
    private readonly coveredFaults = new Set<string>();
    
    constructor(
        faults: TCircuitFault[]
    ) {
        this.faults = faults.map(f => f.element + f.value);
    }
    
    markAsCovered(...faults: string[]) {
        for (const faultLabel of faults) {
          this.coveredFaults.add(faultLabel);
        }
    }
    
    isCovered(faultLabel: string): boolean {
        return this.coveredFaults.has(faultLabel);
    }
    
    isFullyCovered(): boolean {
        return !this.faults.some(fault => !this.isCovered(fault));
    }
}