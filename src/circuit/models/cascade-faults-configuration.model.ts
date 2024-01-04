import {TCircuitElement} from "../types/circuit-element.type";

export class CascadeFaultsConfiguration {
    private readonly faults = new Map<TCircuitElement, TCircuitElement[]>();

    constructor(faults?: Partial<{ [master in TCircuitElement]: TCircuitElement[] }>) {
        if (faults) {
            for (const [master, slaves] of Object.entries(faults)) {
                this.addCascadeFault(master as TCircuitElement, slaves);
            }
        }
    }

    getMasterElement(element: TCircuitElement): TCircuitElement | undefined {
        let masterElement: TCircuitElement | undefined = undefined;

        this.faults.forEach((elements, currentMasterElement) => {
            if (elements.includes(element)) {
                masterElement = this.getMasterElement(currentMasterElement) ?? currentMasterElement;
            }
        });

        return masterElement;
    }

    addCascadeFault(master: TCircuitElement, slaves: TCircuitElement[] | TCircuitElement) {
        if (!Array.isArray(slaves)) {
            slaves = [slaves];
        }

        this.faults.set(master, [
            ...(this.faults.get(master) ?? []),
            ...slaves
        ]);
    }
}