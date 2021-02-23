from unittest.mock import patch


class TestMain:
    def test_main(self):
        from main import main

        with patch("main.print") as print_func:
            main()
        print_func.assert_called_once_with("hi")
