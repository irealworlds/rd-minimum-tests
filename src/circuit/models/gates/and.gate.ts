import {IGate} from "./gate.contract";
import {TCircuitElement} from "../../types/circuit-element.type";
import {TCircuitOutputValue} from "../../types/circuit-output-value.type";

export class AndGate implements IGate {
    private inputLabels: TCircuitElement[];

    constructor(
        ...inputLabels: TCircuitElement[]
    ) {
        this.inputLabels = inputLabels;
    }

    compute(inputs: Partial<{ [label in TCircuitElement]: TCircuitOutputValue }>): TCircuitOutputValue {
        return this.inputLabels.map(label => inputs[label]).reduce((accumulator, value) => {
            return accumulator && value;
        }, 1) as TCircuitOutputValue;
    }
}