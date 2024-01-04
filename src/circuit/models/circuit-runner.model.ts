import {CircuitConfiguration} from "./circuit-configuration.model";
import {TCircuitAlgorithm} from "../types/circuit-algorithm.type";
import {TCircuitOutputValue} from "../types/circuit-output-value.type";
import {TCircuitElement} from "../types/circuit-element.type";
import {TCircuitFault} from "../types/circuit-fault.type";
import {TCircuitInput} from "../types/circuit-input.type";

export class CircuitRunner {
    private circuitAlgorithm?: TCircuitAlgorithm;

    constructor(
        public circuitConfiguration: CircuitConfiguration
    ) {
    }

    setCircuitAlgorithm(algorithm: TCircuitAlgorithm): void {
        this.circuitAlgorithm = algorithm;
    }

    runCircuit(input: TCircuitInput, fault: TCircuitFault | null = null): TCircuitInput {
        if (!this.circuitAlgorithm) {
            throw new Error("Algorithm not set on the circuit");
        }

        const circuitValues: TCircuitInput = {};

        for (const [x, value] of Object.entries(this.circuitAlgorithm)) {
            const label = x as TCircuitElement;

            circuitValues[label] = this.getOrOverride(label, fault ?? null, (): TCircuitOutputValue => {
                if (typeof value === "string") {
                    if (value in circuitValues) {
                        return circuitValues[value]!;
                    } else if (value in input) {
                        return input[value]!;
                    } else {
                        throw new Error(`Invalid circuit value called: ${value}.`);
                    }
                } else {
                    return value.compute(circuitValues);
                }
            })
        }

        return circuitValues;
    }

    private getOrOverride(label: TCircuitElement, fault: TCircuitFault | null, generator: () => TCircuitOutputValue): TCircuitOutputValue {
        if (label === fault?.element) {
            return fault.value;
        } else if (this.circuitConfiguration.cascadeFaults.getMasterElement(label)) {
            const masterElement = this.circuitConfiguration.cascadeFaults.getMasterElement(label)!;
            return this.getOrOverride(masterElement, fault, generator);
        } else {
            return generator();
        }
    }
}