// AI-аас ирсэн хариунд байгаа эх сурвалжийг дурдсан илүү тэмдэгт, тоонуудыг арилгадаг функц
export const formatResponse = (content: string | undefined): string => {
    if (!content) return 'No response received. Please try again.';
    return content
        .replace(/【.*?†.*?】/g, '')
        .replace(/(\d+\.\s)/g, '\n$1')
        .replace(/\n\n+/g, '\n')
        .trim();
};