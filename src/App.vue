<script setup lang="ts">
import {TCircuitElement} from "./circuit/types/circuit-element.type";
import {TCircuitFault} from "./circuit/types/circuit-fault.type";
import {TCircuitOutputValue} from "./circuit/types/circuit-output-value.type";
import {circuitAlgorithm} from "./circuit/circuit";
import {CircuitRunner} from "./circuit/models/circuit-runner.model";
import {TCircuitInput} from "./circuit/types/circuit-input.type";
import {circuitConfiguration} from "./circuit/circuit";
import {reactive} from "vue";
import {FaultCoverage} from "./circuit/models/fault-coverage.model.ts";

// Configuration
const circuitRunner = new CircuitRunner(circuitConfiguration);
circuitRunner.setCircuitAlgorithm(circuitAlgorithm);

// Compute inputs
const inputCombinations: Array<TCircuitInput> = [];

// Loop through all possible combinations
for (let i = 0; i < Math.pow(2, circuitConfiguration.inputLabels.length); i++) {
    const currentCombination: TCircuitInput = {};

    // Assign 0 or 1 for each label based on the binary representation of the current iteration index
    for (let j = 0; j < circuitConfiguration.inputLabels.length; j++) {
        const label = circuitConfiguration.inputLabels[circuitConfiguration.inputLabels.length - j - 1] as TCircuitElement;
        currentCombination[label] = (i >> j) & 1 ? 1 : 0;
    }

    // Add the current combination to the list
    inputCombinations.push(Object.fromEntries(Object.entries(currentCombination).sort()));
}

console.debug("Input cases: ", inputCombinations);

// Compute possible faults
const possibleFaults: TCircuitFault[] = circuitConfiguration.circuitElements.flatMap(
    element => ([0, 1] as TCircuitOutputValue[]).map((value: TCircuitOutputValue) => ({
        element,
        value
    }))
);

console.debug("Fault cases: ", possibleFaults);

// Get circuit results
const testResults = reactive<{
    [testLabel: string]: {
        normalElementValues: Partial<{
            [key in TCircuitElement]: TCircuitOutputValue
        }>,
        faultyResults: {
            [faultLabel: string]: TCircuitOutputValue
        }
    }
}>({});
for (const input of inputCombinations) {
    const testLabel: string = Object.entries(input)
        .sort(([a], [z]) => a.charCodeAt(0) - z.charCodeAt(0))
        .map(([, value]) => value)
        .join('');
    const normalResult = circuitRunner.runCircuit(input);

    testResults[testLabel] = {
        normalElementValues: normalResult,
        faultyResults: {}
    };

    for (const fault of possibleFaults) {
        const faultLabel = fault.element + fault.value;
        const faultyResult = circuitRunner.runCircuit(input, fault);

        testResults[testLabel].faultyResults[faultLabel] = faultyResult[circuitConfiguration.outputLabel]!;
    }
}
console.log(testResults.valueOf());


// Figure out tests that are capable of determining faults
const determiningTests: {
    [faultLabel: string]: string[]
} = {};

for (const [testLabel, result] of Object.entries(testResults)) {
    const normalOutput = result.normalElementValues[circuitConfiguration.outputLabel];
    for (const [faultLabel, faultyResult] of Object.entries(result.faultyResults)) {
        if (faultyResult !== normalOutput) {
            if (!(faultLabel in determiningTests)) {
                determiningTests[faultLabel] = [];
            }

            determiningTests[faultLabel].push(testLabel)
        }
    }
}
console.debug("Determining tests", determiningTests);

// Figure out what tests are essential
const faultCoverage = new FaultCoverage(possibleFaults);
const essentialTests = new Set<string>();

const uniquelyCoveredFaults = Object.entries(determiningTests)
    .filter(([_, tests]) => tests.length === 1)
    .map(([key]) => key);
console.debug("Faults that are only covered by one test", uniquelyCoveredFaults);

const faultsByTest = Object.entries(determiningTests)
    .reduce((accumulator, [faultLabel, tests]) => {
        for (const testLabel of tests) {
            if (!(testLabel in accumulator)) {
                accumulator[testLabel] = [];
            }

            accumulator[testLabel].push(faultLabel);
        }
        return accumulator;
    }, {});
const testsByImportance = Object.entries(faultsByTest).sort(([testA, faultsA], [testZ, faultsZ]) => {
    const uniquelyCoveredFaultsSet = new Set(uniquelyCoveredFaults);

    // Check if testA or testZ covers uniquely covered faults
    const testACoversUniquely = faultsA.some(fault => uniquelyCoveredFaultsSet.has(fault));
    const testZCoversUniquely = faultsZ.some(fault => uniquelyCoveredFaultsSet.has(fault));

    if (testACoversUniquely && !testZCoversUniquely) {
        return -1; // Move testA to the top
    } else if (!testACoversUniquely && testZCoversUniquely) {
        return 1; // Move testZ to the top
    } else if (testACoversUniquely && testZCoversUniquely) {
        return 0; // Both tests cover uniquely, maintain their order
    } else {
        return faultsZ - faultsA; // Sort by the number of faults (descending order)
    }
});

for (const [testLabel, coveredFaults] of testsByImportance) {
    const hasUncoveredFaults = coveredFaults.some(fault => !faultCoverage.isCovered(fault));
    if (hasUncoveredFaults) {
        essentialTests.add(testLabel);
        faultCoverage.markAsCovered(...coveredFaults);
    }
}

console.debug("Essential test", essentialTests);

const nonInputLabels = circuitConfiguration.circuitElements.filter(element => element !== circuitConfiguration.outputLabel && !circuitConfiguration.inputLabels.includes(element));
</script>

<template>
    <section class="mb-7">
        <h2 class="text-xl mb-2">
            Test Results
        </h2>
        <table
            class="min-w-full divide-y divide-gray-300 text-center font-monospace border rounded-lg shadow-lg overflow-hidden">
            <thead>
            <tr>
                <th scope="col" :colspan="circuitConfiguration.inputLabels.length"
                    class="px-3 py-3.5 text-sm font-semibold bg-indigo-500 text-white">
                    Inputs
                </th>
                <th scope="col" :colspan="nonInputLabels.length"
                    class="px-3 py-3.5 text-sm font-semibold bg-gray-200">
                    Intermediary
                </th>
                <th scope="col"
                    class="px-3 py-3.5 text-sm font-semibold bg-purple-500 text-white">
                    Output
                </th>
                <th scope="col" :colspan="possibleFaults.length"
                    class="px-3 py-3.5 text-sm font-semibold bg-red-100 text-gray-900">
                    Outputs for faulty cases
                </th>
            </tr>
            <tr>
                <th scope="col" v-for="label of circuitConfiguration.inputLabels"
                    class="px-3 py-3.5 text-sm font-semibold bg-indigo-500 text-white">
                    {{ label }}
                </th>

                <th scope="col" v-for="label of nonInputLabels"
                    class="px-3 py-3.5 text-sm font-semibold bg-gray-200 text-gray-900">
                    {{ label }}
                </th>
                <th scope="col"
                    class="px-3 py-3.5 text-sm font-semibold bg-purple-500 text-white">
                    {{ circuitConfiguration.outputLabel }}
                </th>
                <th scope="col" v-for="fault of possibleFaults"
                    class="px-3 py-3.5 text-sm font-semibold bg-red-100 text-gray-900">
                    {{ fault.element }}{{ fault.value }}
                </th>
            </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
            <tr v-for="[_, result] in Object.entries(testResults).sort()">
                <td class="whitespace-nowrap py-2 pl-4 pr-3 text-sm font-medium text-gray-900 bg-indigo-100"
                    v-for="label of circuitConfiguration.inputLabels">
                    {{ result.normalElementValues[label] }}
                </td>
                <td class="whitespace-nowrap py-2 pl-4 pr-3 text-sm font-medium text-gray-900"
                    v-for="label of nonInputLabels">
                    {{ result.normalElementValues[label] }}
                </td>
                <td class="whitespace-nowrap py-2 pl-4 pr-3 text-sm font-medium text-gray-900 bg-purple-100">
                    {{ result.normalElementValues[circuitConfiguration.outputLabel] }}
                </td>
                <td class="whitespace-nowrap py-2 pl-4 pr-3 text-sm font-medium text-gray-900"
                    v-for="fault of possibleFaults">
                    {{ result.faultyResults[fault.element + fault.value] }}
                </td>
            </tr>
            </tbody>
        </table>
    </section>

    <section class="mb-7">
        <h2 class="text-xl mb-2">
            Determining Tests
        </h2>
        <table
            class="min-w-full divide-y divide-gray-300 text-center font-monospace border rounded-lg shadow-lg overflow-hidden">
            <thead>
            <tr>
                <th scope="col"
                    class="px-3 py-3.5 text-sm font-semibold bg-indigo-500 text-white">
                    {{ circuitConfiguration.inputLabels.join('') }}
                </th>
                <th scope="col" v-for="fault of possibleFaults"
                    class="px-3 py-3.5 text-sm font-semibold bg-red-100 text-gray-900">
                    {{ fault.element }}{{ fault.value }}
                </th>
            </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
            <tr v-for="[testLabel, result] in Object.entries(testResults).sort()">
                <td class="whitespace-nowrap py-2 pl-4 pr-3 text-sm font-medium bg-indigo-100 text-gray-900">
                    <template v-for="label of circuitConfiguration.inputLabels">
                        {{ result.normalElementValues[label] }}
                    </template>
                </td>
                <td class="whitespace-nowrap text-sm font-medium text-gray-900"
                    v-for="fault in possibleFaults">
                    <template v-if="(fault.element + fault.value) in determiningTests">
                        <div
                            class="bg-green-100 w-full h-full py-2 pl-4 pr-3 flex items-center justify-center text-green-900"
                            v-if="determiningTests[(fault.element + fault.value)].includes(testLabel)">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                                 stroke="currentColor" class="w-6 h-6">
                                <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/>
                            </svg>
                        </div>
                    </template>
                </td>
            </tr>
            </tbody>
        </table>
    </section>
    <section class="mb-7">
        <h2 class="text-xl">
            Essential Tests
        </h2>
        <h5 class="text-sm text-gray-500 mb-2">
            {{ faultCoverage.isFullyCovered() ? "Fully covered" : "Not fully covered" }}
        </h5>

        <table
            class="min-w-full divide-y divide-gray-300 text-center font-monospace border rounded-lg shadow-lg overflow-hidden">
            <thead>
            <tr>
                <th scope="col"
                    class="px-3 py-3.5 text-sm font-semibold bg-indigo-500 text-white">
                    {{ circuitConfiguration.inputLabels.join('') }}
                </th>
                <th scope="col" v-for="fault of possibleFaults"
                    class="px-3 py-3.5 text-sm font-semibold bg-gray-200 text-gray-900">
                    {{ fault.element }}{{ fault.value }}
                </th>
            </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
            <tr v-for="testLabel in essentialTests">
                <td class="whitespace-nowrap py-2 pl-4 pr-3 text-sm font-medium bg-indigo-100 text-gray-900">
                    {{ testLabel }}
                </td>
                <td class="whitespace-nowrap text-sm font-medium text-gray-900 py-2 pl-4 pr-3"
                    :class="{ 'bg-green-100 text-green-900': faultCoverage.isCovered((fault.element + fault.value)), 'bg-red-100': !faultCoverage.isCovered((fault.element + fault.value)) }"
                    v-for="fault in possibleFaults">
                    <template v-if="(fault.element + fault.value) in determiningTests">
                        <div
                            class=" w-full h-full flex items-center justify-center"
                            v-if="determiningTests[(fault.element + fault.value)].includes(testLabel)">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                                 stroke="currentColor" class="w-6 h-6">
                                <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/>
                            </svg>
                        </div>
                    </template>
                </td>
            </tr>
            </tbody>
        </table>

    </section>
</template>

<style scoped>
</style>
