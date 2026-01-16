'use client';

import { useCallback } from 'react';
import type { RowData } from '@/types';
import { replaceVariables } from '@/lib/utils';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, UnderlineType } from 'docx';
import parse, { DOMNode, Element, Text } from 'html-react-parser';

// Extend the basic Element type to include the structure we rely on
interface ExtendedElement extends Element {
    children: DOMNode[];
}

// Helper to convert Tailwind colors or hex to hex string without #
const getColor = (color: string) => {
    if (color.startsWith('#')) return color.substring(1);
    return '000000';
};

export function useWordGenerator() {
    const generateWord = useCallback(async (
        row: RowData,
        templateHtml: string,
        filename: string = 'document.docx'
    ): Promise<Blob> => {
        // Replace variables
        const filledHtml = replaceVariables(templateHtml, row);

        // Ensure we parse to an array of nodes
        const parsed = parse(filledHtml);
        const nodes: DOMNode[] = Array.isArray(parsed) ? (parsed as unknown as DOMNode[]) : [parsed as unknown as DOMNode];

        // Recursive function to process nodes into docx elements
        // const processNode = (node: DOMNode): any | null => {
        //     // 1. Text Node
        //     if (node.type === 'text') {
        //         const textNode = node as Text;
        //         return new TextRun({
        //             text: textNode.data,
        //             font: 'Omni BSIC', // Try to enforce font
        //             size: 24, // 24 half-pts = 12pt
        //         });
        //     }

        //     // 2. Element Node
        //     if (node.type === 'tag') {
        //         const element = node as Element;
        //         const tagName = element.name.toLowerCase();

        //         // --- Block Elements ---
        //         if (['p', 'h1', 'h2', 'h3', 'ul', 'ol', 'li'].includes(tagName)) {
        //             const children: any[] = [];
        //             element.children.forEach(child => {
        //                 const processed = processNode(child as DOMNode);
        //                 if (processed) {
        //                     if (Array.isArray(processed)) children.push(...processed);
        //                     else children.push(processed);
        //                 }
        //             });

        //             // Helper to extract alignment
        //             let alignment = AlignmentType.LEFT;
        //             if (element.attribs?.style?.includes('text-align: center') || element.attribs?.align === 'center') alignment = AlignmentType.CENTER;
        //             if (element.attribs?.style?.includes('text-align: right') || element.attribs?.align === 'right') alignment = AlignmentType.RIGHT;
        //             if (element.attribs?.style?.includes('text-align: justify') || element.attribs?.align === 'justify') alignment = AlignmentType.JUSTIFIED;

        //             const paragraphOptions: any = {
        //                 children,
        //                 alignment,
        //                 spacing: { after: 200 }, // Standard spacing
        //             };

        //             if (tagName === 'h1') paragraphOptions.heading = HeadingLevel.HEADING_1;
        //             if (tagName === 'h2') paragraphOptions.heading = HeadingLevel.HEADING_2;
        //             if (tagName === 'h3') paragraphOptions.heading = HeadingLevel.HEADING_3;
        //             if (tagName === 'li') paragraphOptions.bullet = { level: 0 }; // Simple bullet support

        //             return new Paragraph(paragraphOptions);
        //         }

        //         // --- Inline Elements ---
        //         /* Note: html-react-parser nests these differently. 
        //            Simple bold/italic handling requires carrying state down or wrapping.
        //            For robustness, we'll try to map common inlines to TextRun properties.
        //            BUT, since processNode returns objects, we need to handle "Partial TextRuns".
        //            Complexity: <b>Hello <i>World</i></b> -> TextRun(bold, Hello), TextRun(bold+italic, World) implementation is complex directly.

        //            Simplified strategy: Flatten text content for now or simple recurse.
        //         */

        //         // Flatten simple inline tags (b, i, u, strong, em) by applying styles to children
        //         if (['b', 'strong', 'i', 'em', 'u', 'span'].includes(tagName)) {
        //             const children: any[] = [];
        //             element.children.forEach(child => {
        //                 const processed = processNode(child as DOMNode);
        //                 if (processed) {
        //                     if (Array.isArray(processed)) children.push(...processed);
        //                     else children.push(processed);
        //                 }
        //             });

        //             // Apply styles to all child TextRuns
        //             children.forEach(child => {
        //                 if (child instanceof TextRun) {
        //                     if (tagName === 'b' || tagName === 'strong') child.root[1].rPr = { ...child.root[1].rPr, b: {} }; // Internal hack or public API? 
        //                     // Public API: TextRun is immutable-ish. Better to construct with props.
        //                     // Refactor: We need to pass down styles.
        //                     // SKIPPING complex nesting for this MVP step. 
        //                     // We will return children and let parent aggregate.
        //                 }
        //             });
        //             return children;
        //         }

        //         // Page Break
        //         if (element.attribs?.class?.includes('page-break-delimiter')) {
        //             return new Paragraph({
        //                 children: [new TextRun({ text: "", break: 1 })], // Page break command
        //                 pageBreakBefore: true,
        //             });
        //         }
        //     }
        //     return null;
        // };


        /* 
          BETTER APPROACH: Traverse flatter structure OR use a library that maps HTML -> Docx statefully. 
          Given complexity, let's implement a robust recursive mapper that carries style state.
        */

        interface StyleState {
            bold?: boolean;
            italic?: boolean;
            underline?: boolean;
            fontSize?: number;
        }

        const mapDomToDocx = (domNodes: DOMNode[], currentStyles: StyleState = {}): any[] => {
            const results: any[] = [];

            domNodes.forEach(node => {
                if (node.type === 'text') {
                    const textNode = node as Text;
                    // If text is empty/whitespace only? preserve if needed.
                    if (textNode.data) {
                        results.push(new TextRun({
                            text: textNode.data,
                            bold: currentStyles.bold,
                            italics: currentStyles.italic,
                            underline: currentStyles.underline ? { type: UnderlineType.SINGLE, color: "000000" } : undefined,
                            font: 'Omni BSIC',
                            size: currentStyles.fontSize || 24,
                        }));
                    }
                } else if (node.type === 'tag') {
                    const el = node as unknown as ExtendedElement;
                    const tag = el.name;
                    const newStyles = { ...currentStyles };

                    // Parse style string helper
                    const hasStyle = (styleName: string) => el.attribs?.style?.includes(styleName);

                    // Update styles
                    if (tag === 'b' || tag === 'strong' || hasStyle('font-weight: bold')) newStyles.bold = true;
                    if (tag === 'i' || tag === 'em' || hasStyle('font-style: italic')) newStyles.italic = true;
                    if (tag === 'u' || hasStyle('text-decoration: underline')) newStyles.underline = true;

                    // Block Elements create Paragraphs
                    if (['p', 'h1', 'h2', 'h3', 'li', 'div', 'ul', 'ol'].includes(tag)) {
                        // Helper to extract alignment
                        let alignment: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT;
                        if (hasStyle('text-align: center') || el.attribs?.align === 'center') alignment = AlignmentType.CENTER;
                        if (hasStyle('text-align: right') || el.attribs?.align === 'right') alignment = AlignmentType.RIGHT;
                        if (hasStyle('text-align: justify') || el.attribs?.align === 'justify') alignment = AlignmentType.JUSTIFIED;

                        // Recurse for children (which are inline text/runs)
                        const children = mapDomToDocx((el.children as unknown as DOMNode[]) || [], newStyles);

                        // Extract only TextRun objects for the paragraph children
                        // If we find nested paragraphs (like div inside div), we flatten or separate?
                        // Simplified: specific blocks are paragraphs.
                        const runs = children.filter(c => c instanceof TextRun);

                        const pOptions: any = {
                            children: runs,
                            alignment,
                            spacing: { after: 200 }
                        };

                        if (tag === 'h1') pOptions.heading = HeadingLevel.HEADING_1;
                        if (tag === 'h2') pOptions.heading = HeadingLevel.HEADING_2;
                        if (tag === 'h3') pOptions.heading = HeadingLevel.HEADING_3;
                        if (tag === 'li') pOptions.bullet = { level: 0 };

                        // Handle explicit page break div
                        if (el.attribs?.class?.includes('page-break-delimiter')) {
                            results.push(new Paragraph({
                                children: [],
                                pageBreakBefore: true,
                            }));
                            return; // Done
                        }

                        // Only push paragraph if it has content or is an explicit block that should take space
                        if (runs.length > 0 || ['p', 'h1', 'h2', 'h3', 'li'].includes(tag)) {
                            results.push(new Paragraph(pOptions));
                        }

                        // If block contained other blocks (like lists inside divs), we need them too
                        const blocks = children.filter(c => c instanceof Paragraph);
                        results.push(...blocks);

                    } else {
                        // Inline Element (span, b, i, etc) -> Recurse and return simple array of runs
                        const children = mapDomToDocx((el.children as unknown as DOMNode[]) || [], newStyles);
                        results.push(...children);
                    }
                }
            });
            return results;
        };


        const docElements = mapDomToDocx(nodes);

        const doc = new Document({
            sections: [{
                properties: {},
                children: docElements.filter(e => e instanceof Paragraph), // Filter top-level failures
            }],
        });

        const blob = await Packer.toBlob(doc);

        // Download trigger
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        return blob;

    }, []);

    return { generateWord };
}
