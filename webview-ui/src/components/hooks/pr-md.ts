export const usePrMd = () => {
    const imageUpload = ({ file, callback }) => {
        let message;
        const rFilter = /^(image\/bmp|image\/gif|image\/jpge|image\/jpeg|image\/jpg|image\/png|image\/tiff)$/i;
        if (!rFilter.test(file.type)) {
            console.log(rFilter, file.type);
            message = 'Please choose bmp/jpg/jpge/png/gif/tiff type picture to upload';
        } else if (file.size / (1024 * 1024) > 1) {
            message = 'Please choose a picture smaller than 1M to upload';
        }

        if (message) {
            // throw the error message by yourself
            return false;
        } else {
            new Promise((resolve) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', 'https://xxx.xxx.com/v1/xxx');
                xhr.setRequestHeader('yourKey', 'yourValue');

                xhr.addEventListener(
                    'load',
                    (evt) => {
                        const result = JSON.parse(xhr.responseText);
                        resolve(result);
                    },
                    false
                );

                const fd = new FormData();
                fd.append('file', file);
                xhr.send(fd);
            }).then((res: any) => {
                if (res.status === 'success') {
                    callback({ name: file.name, imgUrl: res['imgUrl'], title: res['imgTitle'] });
                } else {
                    // throw your error message
                }
            });
        }
    };


    const valueChange = (val) => {
        console.log(val);
    };


    return {
        imageUpload,
        valueChange
    }
}

