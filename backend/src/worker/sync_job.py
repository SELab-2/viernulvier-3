from src.worker.api_wrapper.general import VNV_Wrapper


if __name__ == '__main__':
    with VNV_Wrapper() as wrapper:
        print(wrapper.GET("/productions", {"page": 1}))
