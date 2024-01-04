import {TCircuitElement} from "../types/circuit-element.type";
import {CascadeFaultsConfiguration} from "./cascade-faults-configuration.model";

export class CircuitConfiguration {
    constructor(
        public inputLabels: TCircuitElement[],
        public outputLabel: TCircuitElement,
        public circuitElements: TCircuitElement[],
        public cascadeFaults = new CascadeFaultsConfiguration(),
    ) {
    }
}